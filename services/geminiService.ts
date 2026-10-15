
import { GoogleGenAI, Type } from "@google/genai";
import { PaleoData, SiteMarker } from "../types";
import { DINOSAUR_DB, DinosaurDatabaseEntry } from "../data/dinosaurData";
import { buildGeologicalTimeMarker } from "../utils/geologicalTime";
import { getClimateVariablesForTaxon } from "../utils/paleoClimate";
import { getLocomotionMetricsForDino } from "../utils/locomotionKinematics";
import { getLifeCycleForDino } from "../utils/ontogenyLifeCycle";
import { getElevationDataForSite } from "../utils/paleoElevation";
import { getDinosaurBlueprintFallback } from "../utils/dinosaurIllustrations";

const getApiKey = (): string | null => {
  return process.env.API_KEY || null;
};

// In-memory cache to prevent redundant API calls for the same taxa/sites
const blueprintCache: Record<string, string> = {};
const textDataCache: Record<string, DinosaurDatabaseEntry> = {};

/**
 * Fast & resilient executor that catches quota limits without freezing the UI.
 */
const withResilientFetch = async <T>(fn: () => Promise<T>, fallbackFn: () => T | Promise<T>): Promise<T> => {
  try {
    const key = getApiKey();
    if (!key) {
      return await fallbackFn();
    }
    return await fn();
  } catch (error: any) {
    const errorMsg = String(error?.message || error || "").toLowerCase();
    const isQuota = errorMsg.includes("429") || error?.status === 429 || errorMsg.includes("exhausted") || errorMsg.includes("quota");
    if (isQuota) {
      console.warn("Gemini API quota reached. Utilizing verified offline paleontological database & blueprint engine.", error);
    } else {
      console.warn("Gemini API request failed, utilizing verified dataset fallback:", error);
    }
    return await fallbackFn();
  }
};

/**
 * GEMINI API: Fetches live data for a specific dinosaur using Structured Outputs.
 */
export const generateLiveDinosaurData = async (query: string): Promise<DinosaurDatabaseEntry | null> => {
  const normalizedQuery = query.toLowerCase().trim();
  if (textDataCache[normalizedQuery]) {
    return textDataCache[normalizedQuery];
  }

  const localMatch = DINOSAUR_DB.find(d => d.name.toLowerCase() === normalizedQuery) || null;
  if (localMatch) {
    textDataCache[normalizedQuery] = localMatch;
    return localMatch;
  }

  return withResilientFetch(
    async () => {
      const apiKey = getApiKey();
      if (!apiKey) return localMatch;
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: {
          parts: [{
            text: `Act as a highly accurate paleontological database. Provide detailed scientific information for the dinosaur or prehistoric creature: "${query}". Include its taxonomy, a comprehensive scientific summary, specific metadata (diet, threat level, etc.), and all major known fossil sites where it has been discovered (must be factually true, with a minimum of 5 sites). For each site, include highly specific geographic coordinates, geological context, inventory of features (skulls, footprints, etc.), and stats.`
          }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The formalized taxon name." },
              summary: { type: Type.STRING, description: "A detailed scientific summary of the creature." },
              metadata: {
                type: Type.OBJECT,
                properties: {
                  threatLevel: { type: Type.STRING },
                  threatScore: { type: Type.INTEGER, description: "1-5 scale" },
                  diet: { type: Type.STRING },
                  packBehavior: { type: Type.STRING },
                  integument: { type: Type.STRING },
                  flight: { type: Type.STRING },
                  osteologicalCompleteness: { type: Type.INTEGER, description: "0-100 percentage" }
                },
                required: ["threatLevel", "threatScore", "diet", "packBehavior", "integument", "flight", "osteologicalCompleteness"]
              },
              sites: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of the fossil site or formation" },
                    coordinates: {
                      type: Type.OBJECT,
                      properties: {
                        lat: { type: Type.NUMBER },
                        lng: { type: Type.NUMBER }
                      },
                      required: ["lat", "lng"]
                    },
                    geologicalContext: {
                      type: Type.OBJECT,
                      properties: {
                        era: { type: Type.STRING },
                        period: { type: Type.STRING },
                        climate: { type: Type.STRING },
                        age: { type: Type.STRING }
                      },
                      required: ["era", "period", "climate", "age"]
                    },
                    inventory: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          description: { type: Type.STRING },
                          category: { type: Type.STRING, enum: ["skull", "skeleton", "footprint", "environment"] }
                        },
                        required: ["name", "description", "category"]
                      }
                    },
                    stats: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          value: { type: Type.STRING },
                          subtext: { type: Type.STRING },
                          iconType: { type: Type.STRING, enum: ["era", "geology", "discovery", "status"] }
                        },
                        required: ["label", "value", "subtext", "iconType"]
                      }
                    }
                  },
                  required: ["name", "coordinates", "geologicalContext", "inventory", "stats"]
                }
              }
            },
            required: ["name", "summary", "metadata", "sites"]
          }
        }
      });

      const resultText = response.text;
      if (resultText) {
        try {
          const parsed = JSON.parse(resultText) as DinosaurDatabaseEntry;
          textDataCache[normalizedQuery] = parsed;
          return parsed;
        } catch (e) {
          console.error("Failed to parse Gemini response as JSON", e);
        }
      }
      return localMatch;
    },
    () => localMatch
  );
};

/**
 * GEMINI API (with local fallback): Finds site markers for a specific dinosaur.
 */
export const fetchSitesForQuery = async (query: string): Promise<SiteMarker[]> => {
  let dino = null;
  try {
    dino = await generateLiveDinosaurData(query);
  } catch (err) {
    console.error("Live data fetch failed, using fallback", err);
  }
  
  if (!dino) {
    dino = DINOSAUR_DB.find(d => d.name.toLowerCase() === query.toLowerCase().trim()) || null;
  }
  
  if (!dino) return [];
  
  return dino.sites.map((site, index) => ({
    name: site.name,
    lat: site.coordinates.lat,
    lng: site.coordinates.lng,
    id: `${dino.name.replace(/\s/g, '-')}-${index}`
  }));
};

/**
 * GEMINI API (with local fallback): Retrieves full PaleoData for a site/dino combo.
 */
export const fetchPaleoData = async (siteName: string, speciesName: string): Promise<PaleoData | null> => {
  let dino = null;
  try {
    dino = await generateLiveDinosaurData(speciesName);
  } catch (err) {
    console.error("Live data fetch failed, using fallback", err);
  }
  
  if (!dino) {
    dino = DINOSAUR_DB.find(d => d.name.toLowerCase() === speciesName.toLowerCase().trim()) || null;
  }

  if (!dino) return null;
  
  const normalize = (str: string) => str.toLowerCase().replace(/[(),.-]/g, ' ').replace(/\s+/g, ' ').trim();
  const targetNorm = normalize(siteName);
  const targetBase = siteName.split(/[,(]/)[0].toLowerCase().trim();

  let site = dino.sites.find(s => s.name === siteName);
  if (!site) {
    site = dino.sites.find(s => normalize(s.name) === targetNorm);
  }
  if (!site) {
    site = dino.sites.find(s => {
      const sBase = s.name.split(/[,(]/)[0].toLowerCase().trim();
      return (sBase.length > 3 && (sBase === targetBase || targetBase.includes(sBase) || sBase.includes(targetBase)));
    });
  }
  if (!site) {
    // If not found directly in this dinosaur's sites, search all dinosaurs in the database
    for (const otherDino of DINOSAUR_DB) {
      const match = otherDino.sites.find(s => {
        const sBase = s.name.split(/[,(]/)[0].toLowerCase().trim();
        return normalize(s.name) === targetNorm || (sBase.length > 3 && (sBase === targetBase || targetBase.includes(sBase)));
      });
      if (match) {
        site = match;
        break;
      }
    }
  }
  if (!site) {
    site = dino.sites[0];
  }

  // Ensure returned site carries the targeted siteName if matched
  const resolvedSite = site ? { ...site, name: siteName || site.name } : dino.sites[0];

  const timeMarker = buildGeologicalTimeMarker(
    resolvedSite.geologicalContext.age, 
    resolvedSite.geologicalContext.period, 
    resolvedSite.geologicalContext.era
  );

  const climateVariables = getClimateVariablesForTaxon(
    resolvedSite.geologicalContext.climate,
    resolvedSite.geologicalContext.period,
    resolvedSite.coordinates.lat
  );

  const locomotion = getLocomotionMetricsForDino(
    dino.name,
    dino.metadata.diet,
    dino.metadata.threatScore
  );

  const lifeCyclePackage = getLifeCycleForDino(dino.name, resolvedSite.coordinates);
  const elevation = getElevationDataForSite(resolvedSite.name, resolvedSite.coordinates, resolvedSite.geologicalContext.climate);
  
  return {
    name: resolvedSite.name,
    coordinates: resolvedSite.coordinates,
    summary: dino.summary,
    geologicalContext: resolvedSite.geologicalContext,
    stats: resolvedSite.stats,
    metadata: dino.metadata,
    features: resolvedSite.inventory,
    timeMarker,
    timeScale: timeMarker,
    climateVariables,
    climate: climateVariables,
    locomotion,
    ontogeny: {
      stages: lifeCyclePackage.stages,
      growthCurve: lifeCyclePackage.growthCurve,
      migrationLapse: lifeCyclePackage.migrationLapse
    },
    migrationLapse: lifeCyclePackage.migrationLapse,
    elevation
  };
};

/**
 * GEMINI API: Generates a technical scientific illustration (with automatic vector fallback on quota limits).
 */
export const generateTaxaBlueprint = async (taxaName: string): Promise<string | null> => {
  if (blueprintCache[taxaName]) {
    return blueprintCache[taxaName];
  }

  const fallback = getDinosaurBlueprintFallback(taxaName);

  const apiKey = getApiKey();
  if (!apiKey) {
    blueprintCache[taxaName] = fallback;
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: `A highly accurate, scientifically-detailed photorealistic depiction of a single ${taxaName}, shown in full-body profile. The dinosaur exhibits realistic, anatomically correct skin textures, scales, and natural organic colorations based on modern paleontological reconstructions. Set against a completely plain, solid white #ffffff background with no textures, shadows, or environment. No text, labels, or scale figures.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64Data = `data:image/png;base64,${part.inlineData.data}`;
        blueprintCache[taxaName] = base64Data;
        return base64Data;
      }
    }
  } catch (err) {
    console.warn("AI Image reconstruction quota reached or unavailable; providing authentic vector field sketch blueprint:", err);
  }

  // Gracefully provide verified vector field sketch blueprint
  blueprintCache[taxaName] = fallback;
  return fallback;
};

/**
 * Registers a newly synthesized dinosaur into the database, cache, and localStorage
 */
export const registerSyntheticDinosaur = (entry: DinosaurDatabaseEntry, persist = true) => {
  const normalized = entry.name.toLowerCase().trim();
  textDataCache[normalized] = entry;
  const existingIdx = DINOSAUR_DB.findIndex(d => d.name.toLowerCase() === normalized);
  if (existingIdx !== -1) {
    DINOSAUR_DB[existingIdx] = entry;
  } else {
    DINOSAUR_DB.unshift(entry);
  }

  if (persist && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('dino_synthetic_taxa');
      const list: DinosaurDatabaseEntry[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(d => d.name.toLowerCase() === normalized);
      if (idx !== -1) {
        list[idx] = entry;
      } else {
        list.unshift(entry);
      }
      localStorage.setItem('dino_synthetic_taxa', JSON.stringify(list));
    } catch (e) {
      console.warn("Could not save synthetic dinosaur to localStorage:", e);
    }
  }
};

/**
 * Loads stored synthetic dinosaurs from localStorage into memory
 */
export const loadStoredSyntheticDinosaurs = () => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('dino_synthetic_taxa');
    if (raw) {
      const list: DinosaurDatabaseEntry[] = JSON.parse(raw);
      list.forEach(entry => {
        registerSyntheticDinosaur(entry, false);
      });
    }
  } catch (e) {
    console.warn("Could not load stored synthetic dinosaurs:", e);
  }
};

// Auto-hydrate on startup
if (typeof window !== 'undefined') {
  loadStoredSyntheticDinosaurs();
}

