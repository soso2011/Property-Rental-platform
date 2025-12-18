import { NextResponse } from "next/server";
import { Readable } from "stream";
import pinataSDK from "@pinata/sdk";

// Ensure environment variables are loaded
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_API_SECRET;
const pinataGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY;

if (!pinataApiKey || !pinataSecretApiKey || !pinataGateway) {
  throw new Error(
    "Pinata API Key, Secret, or Gateway URL is not configured in .env.local"
  );
}

const pinata = new pinataSDK(pinataApiKey, pinataSecretApiKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const metadataString = formData.get("metadata") as string | null; // Expecting stringified JSON

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // --- Pin the file first ---
    const fileStream = Readable.from(Buffer.from(await file.arrayBuffer()));
    const fileResult = await pinata.pinFileToIPFS(fileStream, {
      pinataMetadata: {
        name: file.name, // Use original file name
      },
      pinataOptions: {
        cidVersion: 0,
      },
    });
    const fileIpfsHash = fileResult.IpfsHash;
    const fileIpfsUrl = `${pinataGateway}/ipfs/${fileIpfsHash}`;
    // ---------------------------

    let metadataIpfsHash = null;

    // --- If metadata exists, update it and pin it ---
    if (metadataString) {
      try {
        const metadataObj = JSON.parse(metadataString);

        // Add the image URL to the metadata
        metadataObj.imageUrl = fileIpfsUrl;
        // Optionally add the hash too if needed elsewhere
        // metadataObj.imageIpfsHash = fileIpfsHash;

        const metadataResult = await pinata.pinJSONToIPFS(metadataObj, {
          pinataMetadata: {
            name: `${file.name}-metadata.json`, // Or generate a unique name based on content/hash
          },
          pinataOptions: {
            cidVersion: 0,
          },
        });
        metadataIpfsHash = metadataResult.IpfsHash;
      } catch (e) {
        console.error("Error parsing or pinning metadata:", e);
        // Return error - if metadata is expected, its processing failure is critical
        return NextResponse.json(
          { success: false, error: "Failed to process or pin metadata JSON" },
          { status: 400 }
        );
      }
    }
    // ---------------------------------------------

    // Return both file details and metadata hash (if created)
    return NextResponse.json({
      success: true,
      fileIpfsHash: fileIpfsHash,
      fileIpfsUrl: fileIpfsUrl,
      metadataIpfsHash: metadataIpfsHash,
      // metadataIpfsUrl can be constructed if needed: `${pinataGateway}/ipfs/${metadataIpfsHash}`
    });

  } catch (error) {
    console.error("IPFS Upload Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file or metadata to IPFS" },
      { status: 500 }
    );
  }
} 
