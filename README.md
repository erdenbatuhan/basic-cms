# Basic CMS

A simple CMS (Content Management System) that stores files by their IDs with version control.

### Setup

1) Install the **Serverless CLI** via **NPM**:

    ```bash
    npm install -g serverless
    ```

2) Create an **IAM** user in your **AWS** account **with an access key** and **the policy "AdministratorAccess"**. After creating the **IAM** user, create the following files with the **access key**:

    - **~/.aws/credentials**
        ```bash
        [basic-cms-aws-user]
        aws_access_key_id=YOUR_AWS_ACCESS_KEY_ID
        aws_secret_access_key=YOUR_AWS_SECRET_ACCESS_KEY
        ```
    
    - **~/.aws/config**
        ```bash
        [profile basic-cms-aws-user]
        region=eu-central-1
        ```

3) You must create two buckets on **AWS S3**. Bucket names must be _globally unique_ and _must not contain spaces or uppercase letters_. [See rules for bucket naming](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html).

    - **Deployment Bucket** (e.g. _basic-cms-deployment-bucket-9f256880fd3b_): This bucket is **OPTIONAL** and you can easily delegate bucket creation to _Serverless_ by removing the **deploymentBucket** attribute from the **serverless.yml** file.

        - All options that block public access must be disabled (e.g. _Block all public access = Off_).

    - **Content Bucket** (e.g. _basic-cms-content-bucket-212486bed188):

        - All **options that block public access** must be **disabled** (e.g. _Block all public access = Off_).
        - The **bucket versioning** option should be enabled.
        - Bucket Policy (This bucket and every object in it must be **publicly accessible**):

            ```json
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicRead",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": [
                            "s3:GetObject",
                            "s3:GetObjectVersion"
                        ],
                        "Resource": "arn:aws:s3:::basic-cms-content-bucket-212486bed188/*"
                    }
                ]
            }
            ```

    Do not forget to update the bucket settings in serverless.yml as well:

    ```yml
    ...
    provider:
        ...
        deploymentBucket: <DEPLOYMENT_BUCKET_NAME_GOES_HERE>
        ...
        environment:
            ...
            ["CMS_STORAGE_BUCKET_NAME"]: <CONTENT_BUCKET_NAME_GOES_HERE>
            ["CMS_STORAGE_BUCKET_URL"]: <CONTENT_BUCKET_URL_GOES_HERE>
            ...
        ...
    ...
    ```

### Deployment

Deploy the app to **AWS** via the **Serverless** framework:

```bash
sls deploy --aws-profile basic-cms-aws-user
```

### Local Invocation

Invoke the lambda functions locally:

```bash
sls invoke local --aws-profile basic-cms-aws-user -f upload -p events/upload_image.json
sls invoke local --aws-profile basic-cms-aws-user -f find -p events/find_images.json
```
