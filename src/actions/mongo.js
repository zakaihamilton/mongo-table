"use server";

import { MongoClient } from "mongodb";

// Helper to serialize documents (convert ObjectId to string, etc)
function serializeDocument(doc) {
  return JSON.parse(JSON.stringify(doc, (key, value) => {
    return value;
  }));
}

// Better serializer that specifically targets MongoDB types if possible,
// but JSON.parse(JSON.stringify()) is the robust 'dumb' way to strip methods.
function cleanDocs(docs) {
  return docs.map(doc => {
    // Convert _id to string manually to be nice
    const newDoc = { ...doc };
    if (newDoc._id) {
      newDoc._id = newDoc._id.toString();
    }
    return JSON.parse(JSON.stringify(newDoc));
  });
}

export async function testConnection(uri) {
  let client;
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    await client.db().admin().listDatabases();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    if (client) await client.close();
  }
}

export async function listDatabases(uri) {
  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    const result = await client.db().admin().listDatabases();
    return { databases: result.databases };
  } catch (error) {
    throw new Error(error.message);
  } finally {
    if (client) await client.close();
  }
}

export async function listCollections(uri, dbName) {
  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    return { collections: collections.map(c => ({ name: c.name })) };
  } catch (error) {
    throw new Error(error.message);
  } finally {
    if (client) await client.close();
  }
}

export async function getDocuments(
  uri,
  dbName,
  colName,
  page = 1,
  limit = 20,
  sortField,
  sortDir = 'asc',
  searchQuery
) {
  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(colName);

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (searchQuery) {
      const sample = await collection.findOne({});
      if (sample) {
        const orClauses = [];
        for (const key in sample) {
          if (typeof sample[key] === 'string') {
            orClauses.push({ [key]: { $regex: searchQuery, $options: 'i' } });
          }
        }
        if (orClauses.length > 0) {
          query = { $or: orClauses };
        }
      }
    }

    // Sort
    const sortOptions = {};
    if (sortField) {
      sortOptions[sortField] = sortDir === 'asc' ? 1 : -1;
    } else {
      sortOptions._id = -1; // Default new first
    }

    const totalCount = await collection.countDocuments(query);
    const docs = await collection.find(query).sort(sortOptions).skip(skip).limit(limit).toArray();

    return {
      documents: cleanDocs(docs),
      totalCount,
      page,
      limit
    };
  } catch (error) {
    throw new Error(error.message);
  } finally {
    if (client) await client.close();
  }
}

export async function getAllDocuments(uri, dbName, colName) {
  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(colName);

    const docs = await collection.find({}).toArray();
    return cleanDocs(docs);
  } catch (error) {
    throw new Error(error.message);
  } finally {
    if (client) await client.close();
  }
}

export async function getDocument(uri, dbName, colName, id) {
  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(colName);

    let query = { _id: id };
    try {
      const { ObjectId } = require('mongodb');
      query = { _id: new ObjectId(id) };
    } catch (e) {
      // If ID is not a valid ObjectId, try as string
      query = { _id: id };
    }

    // If first query fails (e.g. valid ObjectId format but stored as string), try fallback
    let doc = await collection.findOne(query);
    if (!doc) {
      doc = await collection.findOne({ _id: id });
    }

    return doc ? serializeDocument(doc) : null;
  } catch (error) {
    throw new Error(error.message);
  } finally {
    if (client) await client.close();
  }
}
