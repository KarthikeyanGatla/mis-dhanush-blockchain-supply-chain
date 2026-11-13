// Uploads a file to IPFS via Pinata and returns its CID.
// NOTE: VITE_PINATA_JWT is bundled into the client. Use a scoped, upload-only
// key for demos; production should proxy uploads through a backend.
export async function uploadToIpfs(file: File): Promise<string> {
  const jwt = import.meta.env.VITE_PINATA_JWT as string | undefined;
  if (!jwt) throw new Error("VITE_PINATA_JWT is not set; paste an IPFS hash manually instead.");
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body,
  });
  if (!res.ok) throw new Error(`Pinata upload failed (${res.status})`);
  return (await res.json()).IpfsHash as string;
}
