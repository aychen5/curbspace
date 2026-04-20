from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import geopandas as gpd
import pandas as pd
from shapely.geometry import box, mapping

from pressure_region_export import export_pressure_assets

ROOT = Path(__file__).resolve().parents[1]
NYC_DOT_ROOT = Path(r"C:\Users\21005060\OneDrive - CUNY\Desktop\NYC_DOT")
DATA_ROOT = NYC_DOT_ROOT / "data"
OUTPUT_ROOT = ROOT / "public" / "data"

PREDICTED_PANEL_PATH = DATA_ROOT / "predicted_panel_df.parquet"
CURB_RULES_PATH = DATA_ROOT / "clean_parking_signs.parquet"
SEGMENT_FEATURES_PATH = DATA_ROOT / "segment_features.parquet"
PLUTO_PATH = DATA_ROOT / "pluto.parquet"
DOUBLE_PARKING_PATH = DATA_ROOT / "double_parking_data.parquet"
SERVICE_REQUEST_GLOB = "service_requests_2022_current-*.parquet"

HOTSPOT_BOUNDS = (-74.012, 40.685, -73.967, 40.705)
HOTSPOT_LABEL = "Downtown Brooklyn"
SQFT_PER_SQ_MI = 27_878_400
TAXI_FHV_PATTERN = re.compile(
    r"(?:\bfhv\b|for[- ]hire|taxi|green taxi|yellow taxi|uber|lyft)",
    re.IGNORECASE,
)


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
    monthly = dates.dt.to_period("M").value_counts()
    if monthly.empty:
        return 0.0
    return float(monthly.mean())


def build_metric(
    *,
    label: str,
    unit: str,
    hotspot_value: float,
    citywide_value: float,
    digits: int = 1,
    proxy: bool = False,
) -> dict[str, Any]:
    ratio = float(hotspot_value / citywide_value) if citywide_value else 0.0
    return {
        "label": label,
        "unit": unit,
        "hotspot_value": round(float(hotspot_value), 6),
        "citywide_value": round(float(citywide_value), 6),
        "hotspot_display": format_value(float(hotspot_value), digits),
        "citywide_display": format_value(float(citywide_value), digits),
        "ratio": round(ratio, 4),
        "comparison_display": f"{format_decimal(ratio)}x NYC" if ratio else "No NYC baseline",
        "proxy": proxy,
    }


def build_hotspot_metrics(
    hotspot_bbox: Any,
) -> tuple[list[dict[str, Any]], str]:
    segments = gpd.read_parquet(SEGMENT_FEATURES_PATH).to_crs(4326)
    hotspot_segments = segments.loc[segments.intersects(hotspot_bbox)].copy()
    for column in [
        "AADT_Stats_2023_Table_AADT",
        "AADT_Stats_2023_Table_Single_Unit_Truck_AADT",
        "AADT_Stats_2023_Table_Combo_Unit_Truck_AADT",
        "n_bus_lanes",
        "bus_stop",
    ]:
        hotspot_segments[column] = pd.to_numeric(
            hotspot_segments[column], errors="coerce"
        ).fillna(0)
        segments[column] = pd.to_numeric(segments[column], errors="coerce").fillna(0)
    segments["streetwidth"] = pd.to_numeric(segments["streetwidth"], errors="coerce").fillna(0)
    hotspot_segments["streetwidth"] = pd.to_numeric(
        hotspot_segments["streetwidth"], errors="coerce"
    ).fillna(0)
    segments["segmentlength"] = pd.to_numeric(
        segments["segmentlength"], errors="coerce"
    ).fillna(0)
    hotspot_segments["segmentlength"] = pd.to_numeric(
        hotspot_segments["segmentlength"], errors="coerce"
    ).fillna(0)
    segments["street_area_sqft"] = segments["streetwidth"] * segments["segmentlength"]
    hotspot_segments["street_area_sqft"] = (
        hotspot_segments["streetwidth"] * hotspot_segments["segmentlength"]
    )
    hotspot_segments["truck_aadt"] = (
        hotspot_segments["AADT_Stats_2023_Table_Single_Unit_Truck_AADT"]
        + hotspot_segments["AADT_Stats_2023_Table_Combo_Unit_Truck_AADT"]
    )
    segments["truck_aadt"] = (
        segments["AADT_Stats_2023_Table_Single_Unit_Truck_AADT"]
        + segments["AADT_Stats_2023_Table_Combo_Unit_Truck_AADT"]
    )

    pluto = gpd.read_parquet(PLUTO_PATH).to_crs(4326)
    hotspot_pluto = pluto.loc[pluto.intersects(hotspot_bbox)].copy()
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
        hotspot_pluto[column] = pd.to_numeric(
            hotspot_pluto[column], errors="coerce"
        ).fillna(0)
        pluto[column] = pd.to_numeric(pluto[column], errors="coerce").fillna(0)

    business_lots = hotspot_pluto.loc[hotspot_pluto["comarea"] > 0]
    citywide_business_lots = pluto.loc[pluto["comarea"] > 0]
    retail_lots = hotspot_pluto.loc[hotspot_pluto["retailarea"] > 0]
    citywide_retail_lots = pluto.loc[pluto["retailarea"] > 0]
    delivery_lot_mask = (
        hotspot_pluto[
            ["officearea", "garagearea", "strgearea", "factryarea", "otherarea"]
        ].sum(axis=1)
        > 0
    )
    delivery_lots = hotspot_pluto.loc[delivery_lot_mask]
    citywide_delivery_lot_mask = (
        pluto[["officearea", "garagearea", "strgearea", "factryarea", "otherarea"]].sum(
            axis=1
        )
        > 0
    )
    citywide_delivery_lots = pluto.loc[citywide_delivery_lot_mask]

    hotspot_land_and_street_area_sq_mi = (
        float(hotspot_pluto["lotarea"].sum()) + float(hotspot_segments["street_area_sqft"].sum())
    ) / SQFT_PER_SQ_MI
    citywide_land_and_street_area_sq_mi = (
        float(pluto["lotarea"].sum()) + float(segments["street_area_sqft"].sum())
    ) / SQFT_PER_SQ_MI

    traffic = hotspot_segments.loc[
        hotspot_segments["AADT_Stats_2023_Table_AADT"] > 0,
        "AADT_Stats_2023_Table_AADT",
    ]
    citywide_traffic = segments.loc[
        segments["AADT_Stats_2023_Table_AADT"] > 0,
        "AADT_Stats_2023_Table_AADT",
    ]
    trucks = hotspot_segments.loc[
        hotspot_segments["truck_aadt"] > 0, "truck_aadt"
    ]
    citywide_trucks = segments.loc[segments["truck_aadt"] > 0, "truck_aadt"]
    bus_serving_segments = hotspot_segments.loc[
        (hotspot_segments["bus_stop"] > 0) | (hotspot_segments["n_bus_lanes"] > 0)
    ]
    citywide_bus_serving_segment_share = float(
        ((segments["bus_stop"] > 0) | (segments["n_bus_lanes"] > 0)).mean() * 100
    )
    hotspot_bus_serving_segment_share = float(
        len(bus_serving_segments) / len(hotspot_segments) * 100
    )

    double_parking = gpd.read_parquet(DOUBLE_PARKING_PATH).to_crs(4326)
    hotspot_double_parking = double_parking.loc[
        double_parking.within(hotspot_bbox)
    ].copy()
    double_parking["created_date"] = pd.to_datetime(
        double_parking["created_date"], errors="coerce"
    )
    hotspot_double_parking["created_date"] = pd.to_datetime(
        hotspot_double_parking["created_date"], errors="coerce"
    )
    pickup_proxy_monthly = mean_monthly_count(hotspot_double_parking["created_date"])
    citywide_pickup_proxy_monthly = mean_monthly_count(double_parking["created_date"])
    hotspot_pickup_proxy_rate = pickup_proxy_monthly / len(hotspot_segments) * 1000
    citywide_pickup_proxy_rate = citywide_pickup_proxy_monthly / len(segments) * 1000

    fhv_dates: list[pd.Series] = []
    citywide_fhv_dates: list[pd.Series] = []
    for path in sorted(DATA_ROOT.glob(SERVICE_REQUEST_GLOB)):
        service_requests = gpd.read_parquet(
            path,
            columns=["created_date", "complaint_type", "descriptor", "geometry"],
        )
        text = (
            service_requests["complaint_type"].fillna("")
            + " | "
            + service_requests["descriptor"].fillna("")
        )
        matches = service_requests.loc[
            text.str.contains(TAXI_FHV_PATTERN, na=False)
        ].copy()
        if matches.empty:
            continue
        citywide_fhv_dates.append(
            pd.to_datetime(matches["created_date"], errors="coerce")
        )
        if matches.crs is not None and matches.crs.to_epsg() != 4326:
            matches = matches.to_crs(4326)
        matches = matches.loc[matches.within(hotspot_bbox)].copy()
        if matches.empty:
            continue
        matches["created_date"] = pd.to_datetime(matches["created_date"], errors="coerce")
        fhv_dates.append(matches["created_date"])

    hotspot_fhv_dates = (
        pd.concat(fhv_dates, ignore_index=True) if fhv_dates else pd.Series(dtype="datetime64[ns]")
    )
    citywide_fhv_date_series = (
        pd.concat(citywide_fhv_dates, ignore_index=True)
        if citywide_fhv_dates
        else pd.Series(dtype="datetime64[ns]")
    )
    fhv_proxy_monthly = mean_monthly_count(hotspot_fhv_dates)
    citywide_fhv_proxy_monthly = mean_monthly_count(citywide_fhv_date_series)
    hotspot_fhv_proxy_rate = fhv_proxy_monthly / len(hotspot_segments) * 1000
    citywide_fhv_proxy_rate = citywide_fhv_proxy_monthly / len(segments) * 1000

    metrics = [
        build_metric(
            label="Business density",
            unit="lots / sq mi",
            hotspot_value=len(business_lots) / hotspot_land_and_street_area_sq_mi,
            citywide_value=len(citywide_business_lots) / citywide_land_and_street_area_sq_mi,
            digits=0,
        ),
        build_metric(
            label="Restaurant / retail density",
            unit="lots / sq mi",
            hotspot_value=len(retail_lots) / hotspot_land_and_street_area_sq_mi,
            citywide_value=len(citywide_retail_lots) / citywide_land_and_street_area_sq_mi,
            digits=0,
        ),
        build_metric(
            label="Delivery-generating land uses",
            unit="lots / sq mi",
            hotspot_value=len(delivery_lots) / hotspot_land_and_street_area_sq_mi,
            citywide_value=len(citywide_delivery_lots) / citywide_land_and_street_area_sq_mi,
            digits=0,
        ),
        build_metric(
            label="Illegal parking",
            unit="311s / mo / 1k segs",
            hotspot_value=hotspot_pickup_proxy_rate,
            citywide_value=citywide_pickup_proxy_rate,
            digits=1,
            proxy=True,
        ),
        build_metric(
            label="Traffic volume",
            unit="daily vehicles",
            hotspot_value=float(traffic.median()),
            citywide_value=float(citywide_traffic.median()),
            digits=0,
        ),
        build_metric(
            label="Bus route presence",
            unit="% of segments",
            hotspot_value=hotspot_bus_serving_segment_share,
            citywide_value=citywide_bus_serving_segment_share,
            digits=1,
        ),
        build_metric(
            label="FHV trip activity",
            unit="311s / mo / 1k segs",
            hotspot_value=hotspot_fhv_proxy_rate,
            citywide_value=citywide_fhv_proxy_rate,
            digits=1,
            proxy=True,
        ),
        build_metric(
            label="Commercial vehicle activity",
            unit="daily trucks",
            hotspot_value=float(trucks.median()),
            citywide_value=float(citywide_trucks.median()),
            digits=0,
        ),
    ]

    source_note = (
        "311 proxy cards: Illegal parking and FHV trip activity."
    )
    return metrics, source_note


def feature_collection(gdf: gpd.GeoDataFrame) -> dict[str, Any]:
    features = []

    for _, row in gdf.iterrows():
        geometry = round_geometry_coords(mapping(row.geometry))
        properties = {
            key: clean_json_value(row[key])
            for key in gdf.columns
            if key != "geometry"
        }
        features.append(
            {
                "type": "Feature",
                "geometry": geometry,
                "properties": properties,
            }
        )

    return {"type": "FeatureCollection", "features": features}


def main() -> None:
    export_pressure_assets()
    return

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

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

    citywide_threshold = segments["risk_mean"].quantile(0.90)
    citywide = segments.loc[segments["risk_mean"] >= citywide_threshold].copy()

    hotspot_bbox = box(*HOTSPOT_BOUNDS)
    hotspot_all = segments.loc[segments.intersects(hotspot_bbox)].copy()
    hotspot_threshold = hotspot_all["risk_mean"].quantile(0.75)
    hotspot = hotspot_all.loc[hotspot_all["risk_mean"] >= hotspot_threshold].copy()

    rules = gpd.read_parquet(CURB_RULES_PATH).to_crs(4326)
    hotspot_rules = rules.loc[rules.within(hotspot_bbox)].copy()
    hotspot_rule_counts = (
        hotspot_rules["rule_type"].value_counts().sort_index().to_dict()
    )

    citywide_geojson = feature_collection(citywide)
    hotspot_geojson = feature_collection(hotspot)

    (OUTPUT_ROOT / "pressure-citywide.geojson").write_text(
        json.dumps(citywide_geojson, separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )
    (OUTPUT_ROOT / "pressure-hotspot.geojson").write_text(
        json.dumps(hotspot_geojson, separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )

    hotspot_metrics, hotspot_source_note = build_hotspot_metrics(hotspot_bbox)

    hotspot_summary = {
        "label": HOTSPOT_LABEL,
        "bounds": HOTSPOT_BOUNDS,
        "citywide_threshold": round(float(citywide_threshold), 6),
        "hotspot_threshold": round(float(hotspot_threshold), 6),
        "citywide_segment_count": int(len(citywide)),
        "hotspot_segment_count": int(len(hotspot)),
        "loading_zone_segment_share": round(
            float((hotspot["loading_zone"] > 0).mean()), 4
        ),
        "bus_stop_segment_share": round(float((hotspot["bus_stop"] > 0).mean()), 4),
        "metered_segment_share": round(
            float((hotspot["metered_parking"] > 0).mean()), 4
        ),
        "rule_type_counts": {
            key: int(value) for key, value in hotspot_rule_counts.items()
        },
        "metrics": hotspot_metrics,
        "source_note": hotspot_source_note,
    }
    (OUTPUT_ROOT / "pressure-hotspot-summary.json").write_text(
        json.dumps(hotspot_summary, separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )

    print("Exported:")
    print(f"  {OUTPUT_ROOT / 'pressure-citywide.geojson'}")
    print(f"  {OUTPUT_ROOT / 'pressure-hotspot.geojson'}")
    print(f"  {OUTPUT_ROOT / 'pressure-hotspot-summary.json'}")


if __name__ == "__main__":
    main()
