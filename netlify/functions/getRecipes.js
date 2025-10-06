import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI; // MongoDB Atlas URI
const client = new MongoClient(uri);

export async function handler(event, context) {
  try {
    await client.connect();
    const db = client.db("mydatabase");
    const recipes = await db.collection("recipes").find({}).toArray();
    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify(recipes)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
