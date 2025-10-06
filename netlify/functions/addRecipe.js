import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export async function handler(event, context) {
  try {
    const data = JSON.parse(event.body);
    await client.connect();
    const db = client.db("mydatabase");
    const result = await db.collection("recipes").insertOne(data);
    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ insertedId: result.insertedId })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
