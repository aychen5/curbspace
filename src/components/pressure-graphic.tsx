import { useEffect, useState, type FormEvent } from "react";

import type { PressureGraphicState } from "../story/pressureChapters";

type PressureGraphicProps = {
  state: PressureGraphicState;
};

type RegionMetric = {
  label: string;
  unit: string;
  region_value: number;
  citywide_value: number;
  region_display: string;
  citywide_display: string;
  comparison_display: string;
  proxy: boolean;
};

type RegionSummary = {
  key: string;
  type: "hotspot" | "borough" | "zip";
  label: string;
  search_label: string;
  lookup_terms: string[];
  note: string;
  metrics: RegionMetric[];
  source_note: string;
};

type RegionSummaryIndex = {
  default_region_key: string;
  summaries: RegionSummary[];
};

function normalizeRegionQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveRegionQuery(query: string, summaries: RegionSummary[]) {
  const normalizedQuery = normalizeRegionQuery(query);
  if (!normalizedQuery) {
    return null;
  }

  const matches = (summary: RegionSummary) =>
    [summary.search_label, summary.label, ...summary.lookup_terms].some(
      (term) => normalizeRegionQuery(term) === normalizedQuery
    );
  const startsWith = (summary: RegionSummary) =>
    [summary.search_label, summary.label, ...summary.lookup_terms].some((term) =>
      normalizeRegionQuery(term).startsWith(normalizedQuery)
    );
  const includes = (summary: RegionSummary) =>
    [summary.search_label, summary.label, ...summary.lookup_terms].some((term) =>
      normalizeRegionQuery(term).includes(normalizedQuery)
    );

  return (
    summaries.find(matches) ??
    summaries.find(startsWith) ??
    summaries.find(includes) ??
    null
  );
}

function pressureMapSrc(
  variant: PressureGraphicState["variant"],
  regionKey?: string | null
) {
  const params = new URLSearchParams({ view: variant });
  if (variant === "hotspot" && regionKey) {
    params.set("region", regionKey);
  }
  return `${import.meta.env.BASE_URL}pressure-map.html?${params.toString()}`;
}

export function PressureGraphic({ state }: PressureGraphicProps) {
  const [hotspotSummary, setHotspotSummary] = useState<RegionSummary | null>(null);
  const [regionIndex, setRegionIndex] = useState<RegionSummaryIndex | null>(null);
  const [selectedRegionKey, setSelectedRegionKey] = useState<string | null>(null);
  const [regionQuery, setRegionQuery] = useState("");
  const [regionError, setRegionError] = useState<string | null>(null);
  const isHotspot = state.variant === "hotspot";
  const lookupEnabled = Boolean(state.enableRegionLookup);
  const summaries = regionIndex?.summaries ?? [];
  const defaultRegion =
    summaries.find((summary) => summary.key === regionIndex?.default_region_key) ?? null;
  const selectedRegion =
    summaries.find(
      (summary) =>
        summary.key === (selectedRegionKey ?? regionIndex?.default_region_key ?? "")
    ) ?? defaultRegion;
  const lockedHotspotRegion = hotspotSummary ?? defaultRegion;
  const activeRegion = lookupEnabled
    ? selectedRegion ?? lockedHotspotRegion
    : lockedHotspotRegion;
  const isDefaultRegion = activeRegion?.key === lockedHotspotRegion?.key;
  const detailEyebrow = lookupEnabled ? "Try yourself!" : "Hotspot zoom";
  const detailLabel =
    activeRegion?.type === "zip"
      ? `ZIP ${activeRegion.label}`
      : activeRegion?.label ?? state.hotspotLabel ?? "Downtown Brooklyn";
  const detailNote =
    lookupEnabled && isDefaultRegion
      ? state.hotspotNote ?? activeRegion?.note ?? "Regional metrics are loading."
      : activeRegion?.note ?? state.hotspotNote ?? "Regional metrics are loading.";
  const detailMetrics = activeRegion?.metrics ?? [];
  const detailSourceNote =
    activeRegion?.source_note ??
    "Regional metrics could not be loaded from the exported summary.";

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${import.meta.env.BASE_URL}data/pressure-hotspot-summary.json`, {
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Hotspot summary failed to load.");
        }

        return response.json() as Promise<RegionSummary>;
      })
      .then((data) => {
        setHotspotSummary(data);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error(error);
      });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!lookupEnabled || regionIndex) {
      return;
    }

    const controller = new AbortController();

    fetch(`${import.meta.env.BASE_URL}data/pressure-region-summaries.json`, {
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Region summaries failed to load.");
        }

        return response.json() as Promise<RegionSummaryIndex>;
      })
      .then((data) => {
        setRegionIndex(data);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error(error);
      });

    return () => {
      controller.abort();
    };
  }, [lookupEnabled, regionIndex]);

  useEffect(() => {
    if (!regionIndex || selectedRegionKey) {
      return;
    }

    const defaultRegion =
      regionIndex.summaries.find(
        (summary) => summary.key === regionIndex.default_region_key
      ) ?? null;
    if (!defaultRegion) {
      return;
    }

    setSelectedRegionKey(defaultRegion.key);
    setRegionQuery(defaultRegion.search_label);
  }, [regionIndex, selectedRegionKey]);

  function handleRegionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const match = resolveRegionQuery(regionQuery, summaries);
    if (!match) {
      setRegionError("Try an NYC borough or ZIP code from the list.");
      return;
    }

    setSelectedRegionKey(match.key);
    setRegionQuery(match.search_label);
    setRegionError(null);
  }

  return (
    <div className={`pressure-scene ${isHotspot ? "pressure-scene--hotspot" : ""}`}>
      <div className="pressure-scene__canvas">
        <div className="pressure-scene__map-shell">
          <iframe
            key={`${state.variant}-${lookupEnabled ? "lookup" : "hotspot"}-${activeRegion?.key ?? "default"}`}
            className="pressure-map-frame"
            title={
              isHotspot
                ? "Carto-style basemap focused on a selected curb pressure region"
                : "Carto-style basemap showing citywide curb pressure"
            }
            src={pressureMapSrc(
              state.variant,
              isHotspot
                ? activeRegion?.key ??
                    lockedHotspotRegion?.key ??
                    regionIndex?.default_region_key
                : null
            )}
          />
        </div>

        <div className="pressure-scene__legend" aria-label="Curb pressure legend">
          <div className="pressure-scene__legend-scale">
            <span>Lower curb pressure</span>
            <span className="pressure-scene__legend-bar" aria-hidden="true" />
            <span>Higher curb pressure</span>
          </div>
        </div>

        {isHotspot ? (
          <div className="pressure-scene__detail-card">
            <p className="pressure-scene__detail-eyebrow">{detailEyebrow}</p>
            <h3>{detailLabel}</h3>
            <p>{detailNote}</p>

            {lookupEnabled ? (
              <>
                <form className="pressure-scene__region-search" onSubmit={handleRegionSubmit}>
                  <label
                    className="pressure-scene__region-search-label"
                    htmlFor="pressure-region-input"
                  >
                    Try another borough or ZIP code
                  </label>
                  <div className="pressure-scene__region-search-row">
                    <input
                      id="pressure-region-input"
                      className="pressure-scene__region-input"
                      list="pressure-region-options"
                      value={regionQuery}
                      onChange={(event) => {
                        setRegionQuery(event.target.value);
                        setRegionError(null);
                      }}
                      placeholder="Brooklyn or 11201"
                    />
                    <button
                      className="pressure-scene__region-button"
                      type="submit"
                      disabled={!summaries.length}
                    >
                      Show
                    </button>
                  </div>
                  <p className="pressure-scene__region-help">
                    Searches borough and ZIP summaries from your local data.
                  </p>
                  {regionError ? (
                    <p className="pressure-scene__region-error">{regionError}</p>
                  ) : null}
                </form>
                <datalist id="pressure-region-options">
                  {summaries.map((summary) => (
                    <option key={summary.key} value={summary.search_label} />
                  ))}
                </datalist>
              </>
            ) : null}

            <div className="pressure-scene__tag-row">
              {detailMetrics.map((metric) => {
                const maxValue = Math.max(
                  metric.region_value,
                  metric.citywide_value,
                  0.0001
                );
                const regionHeight = `${Math.max(
                  (metric.region_value / maxValue) * 100,
                  8
                )}%`;
                const citywideHeight = `${Math.max(
                  (metric.citywide_value / maxValue) * 100,
                  8
                )}%`;
                const isElevated = metric.region_value >= metric.citywide_value;

                return (
                  <div key={metric.label} className="pressure-scene__tag">
                    <div className="pressure-scene__metric-head">
                      <span className="pressure-scene__tag-label">{metric.label}</span>
                      <span
                        className={`pressure-scene__metric-badge ${
                          isElevated
                            ? "pressure-scene__metric-badge--up"
                            : "pressure-scene__metric-badge--down"
                        }`}
                      >
                        {metric.comparison_display}
                      </span>
                    </div>

                    <div className="pressure-scene__metric-meta">
                      <span className="pressure-scene__metric-unit">{metric.unit}</span>
                      {metric.proxy ? (
                        <span className="pressure-scene__metric-proxy">311 proxy</span>
                      ) : null}
                    </div>

                    <div className="pressure-scene__mini-chart">
                      <div className="pressure-scene__mini-column">
                        <span className="pressure-scene__mini-value">
                          {metric.region_display}
                        </span>
                        <div className="pressure-scene__mini-bar-shell">
                          <span
                            className="pressure-scene__mini-bar pressure-scene__mini-bar--hotspot"
                            style={{ height: regionHeight }}
                          />
                        </div>
                        <span className="pressure-scene__mini-label">Selected</span>
                      </div>

                      <div className="pressure-scene__mini-column">
                        <span className="pressure-scene__mini-value">
                          {metric.citywide_display}
                        </span>
                        <div className="pressure-scene__mini-bar-shell">
                          <span
                            className="pressure-scene__mini-bar pressure-scene__mini-bar--citywide"
                            style={{ height: citywideHeight }}
                          />
                        </div>
                        <span className="pressure-scene__mini-label">NYC avg</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="pressure-scene__source-note">{detailSourceNote}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
