import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')

# Intinya di file ini kita upload file ke bucket S3 yang PUBLIC, kalo di lambda kita upload ke bucket S3 yang PRIVATE
bucket_name = 'your-web-bucket-name'
html_file_path = 'path/to/your/file.html'
js_file_path = 'path/to/your/script.js'
# gunakan ../ untuk mengakses file di dalam folder yang berbeda, dan gunakan ./ untuk mengakses file di dalam folder yang sama
# gunakan ctrl + space untuk mendapatkan suggenstion dari path yang ada di dalam folder

def upload_file(bucket_name, file_path, object_name, content_type):
    try:
        s3_client.upload_file(
            file_path,
            bucket_name,
            object_name,
            ExtraArgs={'ContentType': content_type}
        )
        print (f"File {file_path} uploaded to {bucket_name}/{object_name} with content type {content_type}.")
    except ClientError as e:
        print (f"Error uploading file: {e}")
        
def main():
    upload_file(bucket_name, html_file_path, 'index.html', 'text/html')
    upload_file(bucket_name, js_file_path, 'script.js', 'application/javascript')
    
if __name__ == "__main__":
    main()

