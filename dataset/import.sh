#/bin/bash

echo "Attempting to import dataset..."

HOST=localhost
PORT=27017

mongoimport --host $HOST:$PORT --db food_trucks --collection trucks --file data.json