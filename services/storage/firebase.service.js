import { bucket, admin } from "../../config/firebase.js";
import { v4 as uuidv4 } from "uuid";

export const uploadToStorage = async (fileName, file, contentType, accessToken = uuidv4()) => {
  const fileRef = bucket.file(fileName);

  const response = await fileRef
    .save(file, {
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: accessToken,
        },
      },
    })
    .then(() =>
      fileRef
        .getMetadata()
        .then((data) => data[0])
        .catch((error) => false)
    );
  return {
    ...response,
    url: `https://firebasestorage.googleapis.com/v0/b/urbanbuzz-bcfbd.appspot.com/o/${encodeURIComponent(
      response?.name
    )}?alt=media&token=${response?.metadata?.firebaseStorageDownloadTokens}`,
  };
};

export const streamToPromise = async (stream) => {
  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};
