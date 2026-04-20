from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import geopandas as gpd
import pandas as pd
from shapely.geometry import box, mapping

ROOT = Path(__file__).resolve().parents[1]
NYC_DOT_ROOT = Path(r"C:\Users\21005060\OneDrive - CUNY\Desktop\NYC_DOT")
DATA_ROOT = NYC_DOT_ROOT / "data"
OUTPUT_ROOT = ROOT / "public" / "data"

PREDICTED_PANEL_PATH = DATA_ROOT / "predicted_panel_df.parquet"
SEGMENT_FEATURES_PATH = DATA_ROOT / "segment_features.parquet"
CENTERLINE_PATH = DATA_ROOT / "centerline.parquet"
PLUTO_PATH = DATA_ROOT / "pluto.parquet"
DOUBLE_PARKING_PATH = DATA_ROOT / "double_parking_data.parquet"
SERVICE_REQUEST_GLOB = "service_requests_2022_current-*.parquet"

HOTSPOT_BOUNDS = (-74.012, 40.685, -73.967, 40.705)
HOTSPOT_LABEL = "Downtown Brooklyn"
HOTSPOT_REGION_KEY = "hotspot-downtown-brooklyn"
SQFT_PER_SQ_MI = 27_878_400
TAXI_FHV_PATTERN = re.compile(
    r"(?:\bfhv\b|for[- ]hire|taxi|green taxi|yellow taxi|uber|lyft)",
    re.IGNORECASE,
)

BOROUGH_CODE_TO_NAME = {
    "1": "Manhattan",
    "2": "Bronx",
    "3": "Brooklyn",
    "4": "Queens",
    "5": "Staten Island",
}
PLUTO_BOROUGH_TO_NAME = {
    "MN": "Manhattan",
    "BX": "Bronx",
    "BK": "Brooklyn",
    "QN": "Queens",
    "SI": "Staten Island",
}
SERVICE_REQUEST_BOROUGH_TO_NAME = {
    "MANHATTAN": "Manhattan",
    "BRONX": "Bronx",
    "BROOKLYN": "Brooklyn",
    "QUEENS": "Queens",
    "STATEN ISLAND": "Staten Island",
}
BOROUGH_ORDER = [
    "Manhattan",
    "Bronx",
    "Brooklyn",
    "Queens",
    "Staten Island",
]
SOURCE_NOTE = "311 proxy cards: Illegal parking and FHV trip activity."


def round_geometry_coords(value: Any, digits: int = 6) -> Any:
    if isinstance(value, (float, int)):
        return round(float(value), digits)
    if isinstance(value, (list, tuple)):
        return [round_geometry_coords(item, digits) for item in value]
    return value


def clean_json_value(value: Any) -> Any:
    if value is None:
        return None
    if hasattr(value, "item"):
        try:
            value = value.item()
        except (TypeError, ValueError):
            pass
    if isinstance(value, dict):
        return {key: clean_json_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [clean_json_value(item) for item in value]
    try:
        if value != value:
            return None
    except TypeError:
        pass
    return value


def format_int(value: float) -> str:
    return f"{int(round(value)):,}"


def format_decimal(value: float, digits: int = 1) -> str:
    return f"{value:,.{digits}f}"


def format_value(value: float, digits: int = 1) -> str:
    if digits == 0:
        return format_int(value)
    return format_decimal(value, digits)


def mean_monthly_count(dates: pd.Series) -> float:
    monthly = pd.to_datetime(dates, errors="coerce").dropna().dt.to_period("M").value_counts()
    if monthly.empty:
        return 0.0
    return float(monthly.mean())


def normalize_zip(value: Any) -> str | None:
    if value is None:
        return None
    if hasattr(value, "item"):
        try:
            value = value.item()
        except (TypeError, ValueError):
            pass
    text = str(value).strip()
    if not text or text.lower() == "nan":
        return None
    digits = re.sub(r"\D", "", text)
    if len(digits) < 5:
        return None
    digits = digits[:5]
    if digits == "00000":
        return None
    return digits


def choose_zip(left: Any, right: Any) -> str | None:
    return normalize_zip(left) or normalize_zip(right)


def normalize_borough_name(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() == "nan":
        return None
    upper = text.upper()
    return (
        SERVICE_REQUEST_BOROUGH_TO_NAME.get(upper)
        or BOROUGH_CODE_TO_NAME.get(text)
        or PLUTO_BOROUGH_TO_NAME.get(upper)
        or text.title()
    )


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def serializable_bounds(bounds: tuple[float, float, float, float] | list[float]) -> list[float]:
    return [round(float(value), 6) for value in bounds]


def total_bounds_list(gdf: gpd.GeoDataFrame) -> list[float] | None:
    if gdf.empty:
        return None
    min_x, min_y, max_x, max_y = gdf.total_bounds
    if pd.isna(min_x) or pd.isna(min_y) or pd.isna(max_x) or pd.isna(max_y):
        return None
    return serializable_bounds((min_x, min_y, max_x, max_y))


def safe_median(series: pd.Series) -> float:
    clean = pd.to_numeric(series, errors="coerce").dropna()
    if clean.empty:
        return 0.0
    return float(clean.median())


def build_metric(
    *,
    label: str,
    unit: str,
    region_value: float,
    citywide_value: float,
    digits: int = 1,
    proxy: bool = False,
) -> dict[str, Any]:
    ratio = float(region_value / citywide_value) if citywide_value else 0.0
    return {
        "label": label,
        "unit": unit,
        "region_value": round(float(region_value), 6),
        "citywide_value": round(float(citywide_value), 6),
        "region_display": format_value(float(region_value), digits),
        "citywide_display": format_value(float(citywide_value), digits),
        "ratio": round(ratio, 4),
        "comparison_display": (
            f"{format_decimal(ratio)}x NYC" if citywide_value else "No NYC baseline"
        ),
        "proxy": proxy,
    }


def build_lookup_terms(region_type: str, label: str) -> list[str]:
    terms = {label}
    if region_type == "zip":
        terms.update({f"ZIP {label}", f"zip {label}", f"zipcode {label}"})
    if region_type == "borough":
        terms.add(f"{label} borough")
    if region_type == "hotspot":
        terms.update({"Downtown BK", "DT BK"})
    return sorted(terms)


def default_note(region_type: str, label: str) -> str:
    if region_type == "hotspot":
        return (
            "Transit access, civic buildings, loading activity, and short-term curb "
            "demand overlap across the same few blocks."
        )
    if region_type == "borough":
        return (
            f"Borough-scale snapshot using local street, land-use, and curb-demand "
            f"proxy data for {label}."
        )
    return (
        f"ZIP-scale snapshot using local street, land-use, and curb-demand proxy "
        f"data for ZIP {label}."
    )


def prepare_segments() -> gpd.GeoDataFrame:
    segments = gpd.read_parquet(SEGMENT_FEATURES_PATH).to_crs(4326)
    segments["physicalid"] = segments["physicalid"].astype(str)

    for column in [
        "streetwidth",
        "segmentlength",
        "AADT_Stats_2023_Table_AADT",
        "AADT_Stats_2023_Table_Single_Unit_Truck_AADT",
        "AADT_Stats_2023_Table_Combo_Unit_Truck_AADT",
        "n_bus_lanes",
        "bus_stop",
    ]:
        segments[column] = pd.to_numeric(segments[column], errors="coerce").fillna(0)

    centerline = pd.read_parquet(
        CENTERLINE_PATH, columns=["physicalid", "boroughcode", "l_zip", "r_zip"]
    )
    centerline["physicalid"] = centerline["physicalid"].astype(str)
    centerline["borough_name"] = centerline["boroughcode"].map(BOROUGH_CODE_TO_NAME)
    centerline["zip_code"] = [
        choose_zip(left, right)
        for left, right in zip(centerline["l_zip"], centerline["r_zip"], strict=False)
    ]
    centerline = centerline[
        ["physicalid", "borough_name", "zip_code"]
    ].drop_duplicates("physicalid")

    segments = gpd.GeoDataFrame(
        segments.merge(centerline, on="physicalid", how="left"),
        geometry="geometry",
        crs=segments.crs,
    )
    segments["street_area_sqft"] = segments["streetwidth"] * segments["segmentlength"]
    segments["truck_aadt"] = (
        segments["AADT_Stats_2023_Table_Single_Unit_Truck_AADT"]
        + segments["AADT_Stats_2023_Table_Combo_Unit_Truck_AADT"]
    )
    segments["bus_serving"] = (
        (segments["bus_stop"] > 0) | (segments["n_bus_lanes"] > 0)
    ).astype(int)
    return segments


def prepare_pluto() -> gpd.GeoDataFrame:
    pluto = gpd.read_parquet(PLUTO_PATH).to_crs(4326)
    for column in [
        "lotarea",
        "comarea",
        "retailarea",
        "officearea",
        "garagearea",
        "strgearea",
        "factryarea",
        "otherarea",
    ]:
        pluto[column] = pd.to_numeric(pluto[column], errors="coerce").fillna(0)
    pluto["borough_name"] = pluto["borough"].map(PLUTO_BOROUGH_TO_NAME)
    pluto["zip_code"] = pluto["zipcode"].map(normalize_zip)
    return pluto


def prepare_double_parking(segment_attrs: pd.DataFrame) -> gpd.GeoDataFrame:
    double_parking = gpd.read_parquet(DOUBLE_PARKING_PATH).to_crs(4326)
    double_parking["physicalid"] = double_parking["physicalid"].astype(str)
    double_parking["created_date"] = pd.to_datetime(
        double_parking["created_date"], errors="coerce"
    )
    return gpd.GeoDataFrame(
        double_parking.merge(segment_attrs, on="physicalid", how="left"),
        geometry="geometry",
        crs=double_parking.crs,
    )


def prepare_fhv_matches() -> gpd.GeoDataFrame:
    matched_frames: list[gpd.GeoDataFrame] = []
    for path in sorted(DATA_ROOT.glob(SERVICE_REQUEST_GLOB)):
        service_requests = gpd.read_parquet(
            path,
            columns=[
                "created_date",
                "complaint_type",
                "descriptor",
                "incident_zip",
                "borough",
                "geometry",
            ],
        )
        text = (
            service_requests["complaint_type"].fillna("")
            + " | "
            + service_requests["descriptor"].fillna("")
        )
        matches = service_requests.loc[text.str.contains(TAXI_FHV_PATTERN, na=False)].copy()
        if matches.empty:
            continue
        if matches.crs is not None and matches.crs.to_epsg() != 4326:
            matches = matches.to_crs(4326)
        matches["created_date"] = pd.to_datetime(matches["created_date"], errors="coerce")
        matches["borough_name"] = matches["borough"].map(normalize_borough_name)
        matches["zip_code"] = matches["incident_zip"].map(normalize_zip)
        matched_frames.append(matches)

    if not matched_frames:
        return gpd.GeoDataFrame(
            {
                "created_date": pd.Series(dtype="datetime64[ns]"),
                "borough_name": pd.Series(dtype="object"),
                "zip_code": pd.Series(dtype="object"),
            },
            geometry=gpd.GeoSeries([], crs=4326),
            crs=4326,
        )

    fhv_matches = pd.concat(matched_frames, ignore_index=True)
    return gpd.GeoDataFrame(fhv_matches, geometry="geometry", crs=4326)


def build_citywide_stats(
    segments: gpd.GeoDataFrame,
    pluto: gpd.GeoDataFrame,
    double_parking: gpd.GeoDataFrame,
    fhv_matches: gpd.GeoDataFrame,
) -> dict[str, float]:
    delivery_mask = (
        pluto[["officearea", "garagearea", "strgearea", "factryarea", "otherarea"]].sum(axis=1)
        > 0
    )
    land_and_street_area_sq_mi = (
        float(pluto["lotarea"].sum()) + float(segments["street_area_sqft"].sum())
    ) / SQFT_PER_SQ_MI
    traffic = segments.loc[
        segments["AADT_Stats_2023_Table_AADT"] > 0, "AADT_Stats_2023_Table_AADT"
    ]
    trucks = segments.loc[segments["truck_aadt"] > 0, "truck_aadt"]

    return {
        "business_density": float((pluto["comarea"] > 0).sum()) / land_and_street_area_sq_mi,
        "retail_density": float((pluto["retailarea"] > 0).sum()) / land_and_street_area_sq_mi,
        "delivery_density": float(delivery_mask.sum()) / land_and_street_area_sq_mi,
        "pickup_rate": mean_monthly_count(double_parking["created_date"]) / len(segments) * 1000,
        "traffic_volume": safe_median(traffic),
        "bus_share": float(segments["bus_serving"].mean() * 100),
        "fhv_rate": mean_monthly_count(fhv_matches["created_date"]) / len(segments) * 1000,
        "truck_volume": safe_median(trucks),
    }


def build_region_summary(
    *,
    key: str,
    label: str,
    region_type: str,
    bounds: list[float],
    segments: gpd.GeoDataFrame,
    pluto: gpd.GeoDataFrame,
    double_parking_dates: pd.Series,
    fhv_dates: pd.Series,
    citywide_stats: dict[str, float],
    note: str | None = None,
) -> dict[str, Any] | None:
    if segments.empty or pluto.empty or not bounds:
        return None

    delivery_mask = (
        pluto[["officearea", "garagearea", "strgearea", "factryarea", "otherarea"]].sum(axis=1)
        > 0
    )
    land_and_street_area_sq_mi = (
        float(pluto["lotarea"].sum()) + float(segments["street_area_sqft"].sum())
    ) / SQFT_PER_SQ_MI
    if land_and_street_area_sq_mi <= 0:
        return None

    traffic = segments.loc[
        segments["AADT_Stats_2023_Table_AADT"] > 0, "AADT_Stats_2023_Table_AADT"
    ]
    trucks = segments.loc[segments["truck_aadt"] > 0, "truck_aadt"]
    pickup_rate = mean_monthly_count(double_parking_dates) / len(segments) * 1000
    fhv_rate = mean_monthly_count(fhv_dates) / len(segments) * 1000

    metrics = [
        build_metric(
            label="Business density",
            unit="lots / sq mi",
            region_value=float((pluto["comarea"] > 0).sum()) / land_and_street_area_sq_mi,
            citywide_value=citywide_stats["business_density"],
            digits=0,
        ),
        build_metric(
            label="Restaurant / retail density",
            unit="lots / sq mi",
            region_value=float((pluto["retailarea"] > 0).sum()) / land_and_street_area_sq_mi,
            citywide_value=citywide_stats["retail_density"],
            digits=0,
        ),
        build_metric(
            label="Delivery-generating land uses",
            unit="lots / sq mi",
            region_value=float(delivery_mask.sum()) / land_and_street_area_sq_mi,
            citywide_value=citywide_stats["delivery_density"],
            digits=0,
        ),
        build_metric(
            label="Illegal parking",
            unit="311s / mo / 1k segs",
            region_value=pickup_rate,
            citywide_value=citywide_stats["pickup_rate"],
            digits=1,
            proxy=True,
        ),
        build_metric(
            label="Traffic volume",
            unit="daily vehicles",
            region_value=safe_median(traffic),
            citywide_value=citywide_stats["traffic_volume"],
            digits=0,
        ),
        build_metric(
            label="Bus route presence",
            unit="% of segments",
            region_value=float(segments["bus_serving"].mean() * 100),
            citywide_value=citywide_stats["bus_share"],
            digits=1,
        ),
        build_metric(
            label="FHV trip activity",
            unit="311s / mo / 1k segs",
            region_value=fhv_rate,
            citywide_value=citywide_stats["fhv_rate"],
            digits=1,
            proxy=True,
        ),
        build_metric(
            label="Commercial vehicle activity",
            unit="daily trucks",
            region_value=safe_median(trucks),
            citywide_value=citywide_stats["truck_volume"],
            digits=0,
        ),
    ]

    return {
        "key": key,
        "type": region_type,
        "label": label,
        "search_label": label,
        "lookup_terms": build_lookup_terms(region_type, label),
        "note": note or default_note(region_type, label),
        "bounds": bounds,
        "metrics": metrics,
        "source_note": SOURCE_NOTE,
    }


def feature_collection(gdf: gpd.GeoDataFrame) -> dict[str, Any]:
    features = []
    for _, row in gdf.iterrows():
        geometry = round_geometry_coords(mapping(row.geometry))
        properties = {
            key: clean_json_value(row[key]) for key in gdf.columns if key != "geometry"
        }
        features.append(
            {
                "type": "Feature",
                "geometry": geometry,
                "properties": properties,
            }
        )
    return {"type": "FeatureCollection", "features": features}


def export_map_layers() -> dict[str, float]:
    predicted_panel = gpd.read_parquet(
        PREDICTED_PANEL_PATH,
        columns=[
            "physicalid",
            "pred_log_risk",
            "pred_risk_raw",
            "geometry",
            "loading_zone",
            "bus_stop",
            "metered_parking",
        ],
    )
    predicted_panel["physicalid"] = predicted_panel["physicalid"].astype(str)

    aggregated = (
        predicted_panel.groupby("physicalid", as_index=False)
        .agg(
            risk_mean=("pred_log_risk", "mean"),
            risk_max=("pred_log_risk", "max"),
            raw_risk_mean=("pred_risk_raw", "mean"),
            loading_zone=("loading_zone", "max"),
            bus_stop=("bus_stop", "max"),
            metered_parking=("metered_parking", "max"),
        )
    )

    segment_geometries = predicted_panel[["physicalid", "geometry"]].drop_duplicates(
        "physicalid"
    )
    segments = gpd.GeoDataFrame(
        segment_geometries.merge(aggregated, on="physicalid"),
        geometry="geometry",
        crs=predicted_panel.crs,
    )
    segments["geometry"] = segments.geometry.simplify(5, preserve_topology=False)
    segments = segments.to_crs(4326)

    citywide_threshold = float(segments["risk_mean"].quantile(0.90))
    citywide = segments.loc[segments["risk_mean"] >= citywide_threshold].copy()

    hotspot_bbox = box(*HOTSPOT_BOUNDS)
    hotspot_all = segments.loc[segments.intersects(hotspot_bbox)].copy()
    hotspot_threshold = float(hotspot_all["risk_mean"].quantile(0.75))
    hotspot = hotspot_all.loc[hotspot_all["risk_mean"] >= hotspot_threshold].copy()

    (OUTPUT_ROOT / "pressure-citywide.geojson").write_text(
        json.dumps(feature_collection(citywide), separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )
    (OUTPUT_ROOT / "pressure-hotspot.geojson").write_text(
        json.dumps(feature_collection(hotspot), separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )

    return {
        "citywide_threshold": round(citywide_threshold, 6),
        "hotspot_threshold": round(hotspot_threshold, 6),
        "citywide_segment_count": int(len(citywide)),
        "hotspot_segment_count": int(len(hotspot)),
    }


def export_pressure_assets() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    segments = prepare_segments()
    pluto = prepare_pluto()
    segment_attrs = segments[["physicalid", "borough_name", "zip_code"]].drop_duplicates(
        "physicalid"
    )
    double_parking = prepare_double_parking(segment_attrs)
    fhv_matches = prepare_fhv_matches()
    citywide_stats = build_citywide_stats(segments, pluto, double_parking, fhv_matches)
    map_stats = export_map_layers()

    hotspot_bbox = box(*HOTSPOT_BOUNDS)
    hotspot_segments = segments.loc[segments.intersects(hotspot_bbox)].copy()
    hotspot_pluto = pluto.loc[pluto.intersects(hotspot_bbox)].copy()
    hotspot_double_geometry = double_parking.geometry.apply(
        lambda geometry: geometry is not None and not geometry.is_empty
    )
    hotspot_fhv_geometry = fhv_matches.geometry.apply(
        lambda geometry: geometry is not None and not geometry.is_empty
    )
    hotspot_double_parking = double_parking.loc[
        hotspot_double_geometry & double_parking.within(hotspot_bbox)
    ].copy()
    hotspot_fhv = fhv_matches.loc[
        hotspot_fhv_geometry & fhv_matches.within(hotspot_bbox)
    ].copy()

    hotspot_summary = build_region_summary(
        key=HOTSPOT_REGION_KEY,
        label=HOTSPOT_LABEL,
        region_type="hotspot",
        bounds=serializable_bounds(HOTSPOT_BOUNDS),
        segments=hotspot_segments,
        pluto=hotspot_pluto,
        double_parking_dates=hotspot_double_parking["created_date"],
        fhv_dates=hotspot_fhv["created_date"],
        citywide_stats=citywide_stats,
    )
    if hotspot_summary is None:
        raise RuntimeError("Downtown Brooklyn hotspot summary could not be generated.")
    hotspot_summary.update(map_stats)

    borough_summaries: list[dict[str, Any]] = []
    for borough in BOROUGH_ORDER:
        borough_segments = segments.loc[segments["borough_name"] == borough].copy()
        borough_pluto = pluto.loc[pluto["borough_name"] == borough].copy()
        summary = build_region_summary(
            key=f"borough-{slugify(borough)}",
            label=borough,
            region_type="borough",
            bounds=total_bounds_list(borough_segments) or [],
            segments=borough_segments,
            pluto=borough_pluto,
            double_parking_dates=double_parking.loc[
                double_parking["borough_name"] == borough, "created_date"
            ],
            fhv_dates=fhv_matches.loc[fhv_matches["borough_name"] == borough, "created_date"],
            citywide_stats=citywide_stats,
        )
        if summary is not None:
            borough_summaries.append(summary)

    zip_codes = sorted(
        {
            *segments["zip_code"].dropna().unique().tolist(),
            *pluto["zip_code"].dropna().unique().tolist(),
        }
    )
    zip_summaries: list[dict[str, Any]] = []
    for zip_code in zip_codes:
        zip_segments = segments.loc[segments["zip_code"] == zip_code].copy()
        zip_pluto = pluto.loc[pluto["zip_code"] == zip_code].copy()
        summary = build_region_summary(
            key=f"zip-{zip_code}",
            label=zip_code,
            region_type="zip",
            bounds=total_bounds_list(zip_segments) or [],
            segments=zip_segments,
            pluto=zip_pluto,
            double_parking_dates=double_parking.loc[
                double_parking["zip_code"] == zip_code, "created_date"
            ],
            fhv_dates=fhv_matches.loc[fhv_matches["zip_code"] == zip_code, "created_date"],
            citywide_stats=citywide_stats,
        )
        if summary is not None:
            zip_summaries.append(summary)

    region_index = {
        "default_region_key": HOTSPOT_REGION_KEY,
        "summaries": [hotspot_summary, *borough_summaries, *zip_summaries],
    }

    (OUTPUT_ROOT / "pressure-hotspot-summary.json").write_text(
        json.dumps(hotspot_summary, separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )
    (OUTPUT_ROOT / "pressure-region-summaries.json").write_text(
        json.dumps(region_index, separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )

    print("Exported:")
    print(f"  {OUTPUT_ROOT / 'pressure-citywide.geojson'}")
    print(f"  {OUTPUT_ROOT / 'pressure-hotspot.geojson'}")
    print(f"  {OUTPUT_ROOT / 'pressure-hotspot-summary.json'}")
    print(f"  {OUTPUT_ROOT / 'pressure-region-summaries.json'}")


def main() -> None:
    export_pressure_assets()


if __name__ == "__main__":
    main()
