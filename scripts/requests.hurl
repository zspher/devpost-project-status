# get all entries
GET http://localhost:8000/api/projects/

HTTP 200

# add entry
POST http://localhost:8000/api/projects/
{
    "name": "Test Project 1",
    "git_url": "https://github.com/cas-scale/small",
    "devpost_url": "https://sandbox-test-2.devpost.com/submissions/1300008-test-project-1"
}
HTTP 201
[Asserts]
jsonpath "$.name" == "Test Project 1"
jsonpath "$.first_commit.hash" == "8433782b9aae93faeab6d635b993007c8766d561"

# add entry faulty git url
POST http://localhost:8000/api/projects/
{
    "name": "Test Project 2",
    "git_url": "https://github.com/example/id",
    "devpost_url": "https://sandbox-test-2.devpost.com/submissions/1300008-test-project-2"
}
HTTP 201
[Asserts]
jsonpath "$.name" == "Test Project 2"
jsonpath "$.status" == "no_access"

# get entry
GET http://localhost:8000/api/projects/1

HTTP 200

# delete entry
DELETE http://localhost:8000/api/projects/1

HTTP 204

# delete not created entry
DELETE http://localhost:8000/api/projects/909

HTTP 404

# CORS: allowed origin gets CORS headers on a simple request
GET http://localhost:8000/api/projects/
Origin: http://localhost:3000

HTTP 200
[Asserts]
header "Access-Control-Allow-Origin" == "http://localhost:3000"

# CORS: preflight from allowed origin
OPTIONS http://localhost:8000/api/projects/
Origin: http://localhost:3000
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type

HTTP 200
[Asserts]
header "Access-Control-Allow-Origin" == "http://localhost:3000"
header "Access-Control-Allow-Methods" contains "POST"

# CORS: disallowed origin gets NO CORS headers
GET http://localhost:8000/api/projects/
Origin: http://evil.example.com

HTTP 200
[Asserts]
header "Access-Control-Allow-Origin" not exists
