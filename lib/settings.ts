import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export interface ChannelSettings {
  "click-collect": {
    leadMinutes: number;
    cutOffMinutesBeforeClose: number;
    enabled: boolean;
    squareOnlineUrl: string;
  };
  "order-at-table": {
    enabled: boolean;
    squareOnlineUrl: string;
  };
  catering: {
    leadHours: number;
    minHeadcount: number;
    enabled: boolean;
    replyEmail: string;
  };
  cakes: {
    leadHours: number;
    enabled: boolean;
    replyEmail: string;
  };
}

export interface CakeSizeRecord {
  id: string;
  inches: number;
  price: number; // pence
  serves: string;
  label: string;
}

export interface SettingsFile {
  channels: ChannelSettings;
  cake: {
    sizes: CakeSizeRecord[];
    imageShapeSurcharge: number;
    fillingSurcharges: { fruits: number; jam: number };
  };
}

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
  return JSON.parse(raw) as T;
}
async function writeJson(file: string, data: unknown): Promise<void> {
  const tmp = path.join(DATA_DIR, `${file}.tmp`);
  const final = path.join(DATA_DIR, file);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, final);
}

export const getSettings = (): Promise<SettingsFile> =>
  readJson<SettingsFile>("settings.json");

export const saveSettings = (data: SettingsFile) =>
  writeJson("settings.json", data);
