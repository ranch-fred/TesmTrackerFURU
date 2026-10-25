const PAGE_SIZE = 100;

function dataOrThrow(result) {
  if (result.error) throw result.error;
  return result.data;
}

// Storage folders are virtual, so collect every file path before removing them.
export async function removeTeamFiles(client, teamId) {
  const bucket = client.storage.from('team-files');
  const paths = [];
  async function visit(folder) {
    let offset = 0;
    while (true) {
      const entries = dataOrThrow(await bucket.list(folder, { limit: PAGE_SIZE, offset })) || [];
      for (const entry of entries) {
        const path = `${folder}/${entry.name}`;
        if (entry.id == null) await visit(path);
        else paths.push(path);
      }
      if (entries.length < PAGE_SIZE) break;
      offset += entries.length;
    }
  }
  await visit(teamId);
  for (let i = 0; i < paths.length; i += PAGE_SIZE)
    dataOrThrow(await bucket.remove(paths.slice(i, i + PAGE_SIZE)));
}
