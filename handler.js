"use strict";

const AWS = require("aws-sdk");
const s3 = new AWS.S3();

module.exports.find = async (event) => {
  const id = event.id || event.queryStringParameters.id;
  const extension = event.extension || event.queryStringParameters.extension || process.env.DEFAULT_EXTENSION;

  console.log(`Finding all versions of the image with ID=${id}..`);

  const path = `${process.env.CMS_STORAGE_BUCKET_DIRECTORY_IMG}/${id}.${extension}`;
  const listObjectVersionsPromise = s3.listObjectVersions({
    Bucket: process.env.CMS_STORAGE_BUCKET_NAME, 
    Prefix: path
   }).promise();

  return await listObjectVersionsPromise.then(({ Versions }) => {
    console.log(`Successfully found all versions of the image with ID=${id}!`);

    return {
      statusCode: Versions.length > 0 ? 200 : 404,
      body: JSON.stringify(Versions.map(({ VersionId }) => (
        `${process.env.CMS_STORAGE_BUCKET_URL}/${path}?versionId=${VersionId}`
      )))
    }
  }).catch(err => {
    console.log(`An error occurred while finding all versions of the image with ID=${id}!`);
    return { statusCode: err.statusCode || 400, body: err.message || "Something went wrong when it should not have!" }
  });
};

module.exports.restore = async (event) => {
  const id = event.id || event.queryStringParameters.id;
  const versionId = event.versionId || event.queryStringParameters.versionId;
  const extension = event.extension || event.queryStringParameters.extension || process.env.DEFAULT_EXTENSION;

  console.log(`Restoring the image with ID=${id} and version=${versionId}..`);

  const path = `${process.env.CMS_STORAGE_BUCKET_DIRECTORY_IMG}/${id}.${extension}`;
  const imageRestored = await s3.getObject({
    Bucket: process.env.CMS_STORAGE_BUCKET_NAME, 
    Key: path,
    VersionId: versionId
  }).promise().then(({ Body }) => Body.toString("base64"));

  return await this.upload({ id, image: imageRestored, extension }).then(({ body }) => {
    return {
      statusCode: 200,
      body: `${body}?versionId=${versionId}`
    }
  }).finally(() => {
    console.log(`Restoration of the image with ID=${id} and version=${versionId} has completed!`);
  })
};

module.exports.upload = async (event) => {
  const id = event.id || event.queryStringParameters.id;
  const encodedImage = event.image || JSON.parse(event.body).image;
  const extension = event.extension || event.queryStringParameters.extension || process.env.DEFAULT_EXTENSION;

  console.log(`Uploading an image (size=${encodedImage.length}) with ID=${id}..`);

  const path = `${process.env.CMS_STORAGE_BUCKET_DIRECTORY_IMG}/${id}.${extension}`;
  const uploadPromise = s3.upload({
    Body: Buffer.from(encodedImage, "base64"),
    Bucket: process.env.CMS_STORAGE_BUCKET_NAME,
    Key: path,
    ContentType: "mime/png"
  }).promise();

  return await uploadPromise.then(() => {
    console.log(`Successfully uploaded an image (size=${encodedImage.length}) with ID=${id}!`);
    return {
      statusCode: 200,
      body: `${process.env.CMS_STORAGE_BUCKET_URL}/${path}`
    }
  }).catch(err => {
    console.log(`An error occurred while uploading an image (size=${encodedImage.length}) with ID=${id}!`);
    return { statusCode: err.statusCode || 400, body: err.message || "Something went wrong when it should not have!" }
  });
};
