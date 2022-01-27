import { parseFile } from "@fast-csv/parse";

export interface PercentileDataEntry {
  token_id: string;
  balance: string;
  length: string;
  length_new: string;
}

/**
 * Loads the data from the file `percentiles.csv`
 */
export async function loadPercentileData(): Promise<PercentileDataEntry[]> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<PercentileDataEntry[]>(async (resolve, reject) => {
    const entries: PercentileDataEntry[] = [];
    parseFile("percentiles.csv", { headers: true })
      .on("error", (error) => {
        return reject(error);
      })
      .on("data", (entry: PercentileDataEntry) => {
        entries.push(entry);
      })
      .on("end", () => {
        return resolve(entries);
      });
  });
}
