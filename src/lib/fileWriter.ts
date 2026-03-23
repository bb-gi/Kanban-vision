export async function writeMdFile(
  rootHandle: FileSystemDirectoryHandle,
  folderPath: string[],
  filename: string,
  content: string
): Promise<void> {
  let current: FileSystemDirectoryHandle = rootHandle;

  for (const segment of folderPath) {
    current = await (current as any).getDirectoryHandle(segment);
  }

  const fileHandle = await (current as any).getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
