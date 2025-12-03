export async function getRandomMegalithImage() {
  const dataset = "madebyollin/megalith-10m";

  try {
    // 1. Get dataset metadata to find the split name and total rows
    console.log("Fetching dataset metadata...");
    const sizeResponse = await fetch(
      `https://datasets-server.huggingface.co/size?dataset=${dataset}`
    );

    if (!sizeResponse.ok) throw new Error("Failed to fetch dataset metadata");
    const sizeData = await sizeResponse.json();

    // Navigate the JSON structure to find the valid split and row count
    // usually structure is: sizeData.size.configs[0].splits[0]
    const config = sizeData.size.configs[0];
    const splitInfo =
      config.splits.find((s) => s.split === "train") || config.splits[0];

    const configName = config.config; // likely 'default'
    const splitName = splitInfo.split; // likely 'megalith' or 'train'
    const totalRows = splitInfo.num_rows;

    console.log(
      `Found split: "${splitName}" with ${totalRows.toLocaleString()} rows.`
    );

    // 2. Generate a random offset
    const randomOffset = Math.floor(Math.random() * totalRows);

    // 3. Fetch a single row at the random offset
    // We ask for length=1 to get just one image
    console.log(`Fetching row at index ${randomOffset}...`);
    const rowsResponse = await fetch(
      `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${configName}&split=${splitName}&offset=${randomOffset}&length=1`
    );

    if (!rowsResponse.ok) throw new Error("Failed to fetch row");
    const rowsData = await rowsResponse.json();

    // 4. Extract the image data
    // The API returns a list of features and a list of rows
    const row = rowsData.rows[0].row;

    // The dataset has 'url', 'url_highres', and 'url_source'.
    // We'll prefer highres, then standard, then source.
    const imageUrl = row.url_highres || row.url || row.url_source;

    console.log("Random Image URL:", imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("Error getting random image:", error);
  }
}
