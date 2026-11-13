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
