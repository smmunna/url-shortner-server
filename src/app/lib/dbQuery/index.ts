import { promises as fs } from 'fs';
import path from 'path';

// Path to the database file
const dbFilePath = path.join(__dirname, '../../../../db.json');

// Utility function to read the database
async function readDB() {
    try {
        const fileContent = await fs.readFile(dbFilePath, 'utf-8');
        return fileContent.trim() ? JSON.parse(fileContent) : { users: [] }; // Return empty structure if file is empty
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            // File doesn't exist, initialize it
            return { users: [] };
        } else {
            throw err;
        }
    }
}

// Utility function to write to the database
async function writeDB(data: any) {
    await fs.writeFile(dbFilePath, JSON.stringify(data, null, 2));
}

// Insert a single document into a specific collection
export async function insertOne(collection: string, document: any) {
    const dbContent = await readDB();

    // Ensure the collection exists
    if (!dbContent[collection]) {
        dbContent[collection] = [];
    }

    // Check if the input is an array
    if (Array.isArray(document)) {
        // Map over the array to add unique IDs
        const newDocuments = document.map((doc) => ({ id: Date.now(), ...doc }));
        dbContent[collection].push(...newDocuments);
        await writeDB(dbContent);
        return newDocuments; // Return the array of newly created documents
    }

    // Handle single object
    const newDocument = { id: Date.now(), ...document };
    dbContent[collection].push(newDocument);
    await writeDB(dbContent);
    return newDocument; // Return the newly created document
}


// Insert multiple documents into a specific collection
export async function insertMany(collection: string, documents: any[]) {
    const dbContent = await readDB();
    const newDocuments = documents.map((doc) => ({ id: Date.now(), ...doc }));

    if (!dbContent[collection]) {
        dbContent[collection] = []; // Initialize collection if it doesn't exist
    }

    dbContent[collection].push(...newDocuments);
    await writeDB(dbContent);

    return newDocuments; // Return the newly created documents
}

// Find all documents in a specific collection
export async function findAll(
    collection: string,
    query: any = {},      // Query filter
    projection: any = {}, // Fields to include/exclude
    options: {
        sortField?: string;  // Field to sort by
        sortOrder?: "asc" | "desc";  // Sorting order: 'asc' or 'desc'
    } = {} // Sorting options
) {
    const dbContent = await readDB();

    // Ensure the collection exists
    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    // Filter documents based on the query
    const results = dbContent[collection].filter((item: any) => {
        return Object.entries(query).every(([key, value]) => String(item[key]) === String(value));
    });

    // Apply sorting
    if (options.sortField) {
        const { sortField, sortOrder = "asc" } = options;
        results.sort((a: any, b: any) => {
            const fieldA = a[sortField];
            const fieldB = b[sortField];

            if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
            if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }

    // Apply projection to each result (field exclusion)
    if (Object.keys(projection).length > 0) {
        return results.map((item: any) => {
            const projectedItem = { ...item };
            Object.entries(projection).forEach(([key, value]) => {
                if (value === 0) {
                    delete projectedItem[key]; // Exclude the field
                }
            });
            return projectedItem;
        });
    }

    return results; // Return filtered and sorted results without projection
}


// Pagination
export async function paginate(
    collection: string,
    query: any = {},      // Query filter
    projection: any = {}, // Fields to include/exclude
    options: {
        page?: number;
        limit?: number;
        sortField?: string;  // Field to sort by
        sortOrder?: "asc" | "desc"  // Sorting order: 'asc' or 'desc'
    } = {} // Pagination, sorting, and filtering options
) {
    const dbContent = await readDB();

    // Ensure the collection exists
    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    // Filter documents based on the query
    const filteredResults = dbContent[collection].filter((item: any) => {
        return Object.entries(query).every(([key, value]) => String(item[key]) === String(value));
    });

    // Apply projection to each result (field exclusion)
    let projectedResults = filteredResults;
    if (Object.keys(projection).length > 0) {
        projectedResults = filteredResults.map((item: any) => {
            const projectedItem = { ...item };
            Object.entries(projection).forEach(([key, value]) => {
                if (value === 0) {
                    delete projectedItem[key]; // Exclude the field
                }
            });
            return projectedItem;
        });
    }

    // Apply sorting
    if (options.sortField) {
        const { sortField, sortOrder = "asc" } = options;
        projectedResults.sort((a: any, b: any) => {
            const fieldA = a[sortField];
            const fieldB = b[sortField];

            if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
            if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }

    // Apply pagination
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const startIndex = (page - 1) * limit;
    const paginatedResults = projectedResults.slice(startIndex, startIndex + limit);

    return {
        total: projectedResults.length,
        page,
        limit,
        totalPages: Math.ceil(projectedResults.length / limit),
        data: paginatedResults
    };
}

// Find One
export async function findOne(
    collection: string,
    query: any,
    projection: any = {} // Fields to include or exclude
) {
    const dbContent = await readDB();

    // Ensure the collection exists
    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    // Find the first matching item based on the query
    const result = dbContent[collection].find((item: any) => {
        return Object.entries(query).every(([key, value]) => String(item[key]) === String(value));
    });

    if (!result) {
        return null; // Return null if no match is found
    }

    // Apply projection (include or exclude fields)
    if (Object.keys(projection).length > 0) {
        const projectedResult = { ...result };

        Object.entries(projection).forEach(([key, value]) => {
            if (value === 0) {
                delete projectedResult[key]; // Exclude the field
            }
        });

        return projectedResult;
    }

    return result; // Return the result if no projection is specified
}

export async function updateOne(collection: string, query: any, update: any) {
    const dbContent = await readDB();

    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    // Find the document that matches the query
    const docIndex = dbContent[collection].findIndex((item: any) => {
        return Object.entries(query).every(([key, value]) => String(item[key]) === String(value));
    });

    if (docIndex === -1) {
        throw new Error('No document found matching the query');
    }

    // Update the document with the new data
    const updatedDocument = {
        ...dbContent[collection][docIndex],
        ...update, // Update only the fields passed in the update object
    };

    // Replace the old document with the updated document
    dbContent[collection][docIndex] = updatedDocument;

    // Write the updated data back to db.json
    await writeDB(dbContent);

    return updatedDocument; // Return the updated document
}

export async function updateMany(collection: string, query: any, update: any) {
    const dbContent = await readDB();

    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    // Find documents matching the query
    const updatedDocuments = dbContent[collection].map((item: any) => {
        const isMatch = Object.entries(query).every(([key, value]) => String(item[key]) === String(value));

        if (isMatch) {
            // Apply the update if the document matches the query
            return { ...item, ...update };
        }

        return item; // If the document doesn't match, return it unchanged
    });

    // Write the updated data back to db.json
    await writeDB({ ...dbContent, [collection]: updatedDocuments });

    return updatedDocuments.filter((item: any) => {
        // Return only the updated documents
        return Object.entries(query).every(([key, value]) => String(item[key]) === String(value));
    });
}

// Delete a document by ID
export async function deleteOne(collection: string, id: any) {
    const dbContent = await readDB();
    const collectionData = dbContent[collection] || [];

    const index = collectionData.findIndex((item: any) => item.id === id);
    if (index === -1) {
        return null; // Document not found
    }

    const [deleted] = collectionData.splice(index, 1); // Remove the document
    await writeDB(dbContent);

    return deleted; // Return the deleted document
}


// AGREEGET FUNCTIONS
function applyProjection(item: any, projection: any) {
    if (Object.keys(projection).length === 0) return item;

    const projectedItem = { ...item };
    Object.entries(projection).forEach(([key, value]) => {
        if (value === 0) {
            delete projectedItem[key]; // Exclude fields
        }
    });
    return projectedItem;
}

export async function min(
    collection: string,
    field: string,
    query: any = {},
    projection: any = {}
) {
    const dbContent = await readDB();

    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    const results = dbContent[collection].filter((item: any) =>
        Object.entries(query).every(([key, value]) => String(item[key]) === String(value))
    ).map(item => applyProjection(item, projection));

    if (results.length === 0) return null;

    return Math.min(...results.map((item: any) => Number(item[field]) || 0));
}

export async function max(
    collection: string,
    field: string,
    query: any = {},
    projection: any = {}
) {
    const dbContent = await readDB();

    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    const results = dbContent[collection].filter((item: any) =>
        Object.entries(query).every(([key, value]) => String(item[key]) === String(value))
    ).map(item => applyProjection(item, projection));

    if (results.length === 0) return null;

    return Math.max(...results.map((item: any) => Number(item[field]) || 0));
}

export async function sum(
    collection: string,
    field: string,
    query: any = {},
    projection: any = {}
) {
    const dbContent = await readDB();

    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    const results = dbContent[collection].filter((item: any) =>
        Object.entries(query).every(([key, value]) => String(item[key]) === String(value))
    ).map(item => applyProjection(item, projection));

    return results.reduce((sum, item: any) => sum + (Number(item[field]) || 0), 0);
}

export async function count(
    collection: string,
    query: any = {},
    projection: any = {}
) {
    const dbContent = await readDB();

    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    const results = dbContent[collection].filter((item: any) =>
        Object.entries(query).every(([key, value]) => String(item[key]) === String(value))
    ).map(item => applyProjection(item, projection));

    return results.length;
}

export async function avg(
    collection: string,
    field: string,
    query: any = {},
    projection: any = {}
) {
    const dbContent = await readDB();

    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    const results = dbContent[collection].filter((item: any) =>
        Object.entries(query).every(([key, value]) => String(item[key]) === String(value))
    ).map(item => applyProjection(item, projection));

    if (results.length === 0) return null;

    const totalSum = results.reduce((sum, item: any) => sum + (Number(item[field]) || 0), 0);
    return totalSum / results.length;
}

// Function to match MongoDB-like queries including regex-based search

type QueryCondition =
    | string
    | number
    | boolean
    | { $eq?: any; $ne?: any; $gt?: number; $gte?: number; $lt?: number; $lte?: number; $in?: any[]; $nin?: any[]; $regex?: string };

function matchQuery(item: any, query: Record<string, QueryCondition>) {
    return Object.entries(query).every(([key, condition]) => {
        if (typeof condition !== "object" || condition === null) {
            return String(item[key]) === String(condition);
        }

        if ("$eq" in condition) return item[key] === condition.$eq;
        if ("$ne" in condition) return item[key] !== condition.$ne;
        if ("$gt" in condition) return item[key] > (condition.$gt as number);
        if ("$gte" in condition) return item[key] >= (condition.$gte as number);
        if ("$lt" in condition) return item[key] < (condition.$lt as number);
        if ("$lte" in condition) return item[key] <= (condition.$lte as number);
        if ("$in" in condition) return Array.isArray(condition.$in) && condition.$in.includes(item[key]);
        if ("$nin" in condition) return Array.isArray(condition.$nin) && !condition.$nin.includes(item[key]);

        // ✅ Fix for $regex
        if ("$regex" in condition && typeof condition.$regex === "string") {
            return new RegExp(condition.$regex, "i").test(String(item[key]));
        }

        return false;
    });
}



// Search function
export async function search(
    collection: string,
    query: any = {},
    projection: any = {}
) {
    const dbContent = await readDB();
    if (!dbContent[collection]) throw new Error(`Collection ${collection} not found`);

    const results = dbContent[collection]
        .filter(item => matchQuery(item, query))
        .map(item => applyProjection(item, projection));

    return results;
}

// Join with Pagination
export async function join(
    fromCollection: string, // Main collection (e.g., "persons")
    lookupConfig: {
        from: string; // Collection to join (e.g., "user")
        localField: string; // Field in the main collection (e.g., "age")
        foreignField: string; // Field in the joined collection (e.g., "age")
        as: string; // Name of the resulting array field
    },
    query: any = {}, // Filter condition
    projection: any = {}, // Fields to exclude (from both collections)
    pagination: { page?: number; limit?: number } = {} // Pagination options
) {
    const dbContent = await readDB();

    // Ensure collections exist
    if (!dbContent[fromCollection] || !dbContent[lookupConfig.from]) {
        throw new Error(`One or more collections not found`);
    }

    const mainCollection = dbContent[fromCollection]; // e.g., "persons"
    const lookupCollection = dbContent[lookupConfig.from]; // e.g., "user"

    // Perform Lookup (Join)
    const results = mainCollection.map((mainItem: any) => {
        let matchingItems = lookupCollection.filter((lookupItem: any) =>
            String(mainItem[lookupConfig.localField]) === String(lookupItem[lookupConfig.foreignField])
        );

        // Apply Projection to Joined Collection
        if (Object.keys(projection).length > 0) {
            matchingItems = matchingItems.map((lookupItem: any) => {
                const projectedLookupItem = { ...lookupItem };
                Object.entries(projection).forEach(([key, value]) => {
                    if (value === 0) delete projectedLookupItem[key]; // Exclude field
                });
                return projectedLookupItem;
            });
        }

        return {
            ...mainItem,
            [lookupConfig.as]: matchingItems // Embed matched documents
        };
    });

    // Apply Query Filter
    let filteredResults = results.filter((item: any) => {
        return Object.entries(query).every(([key, value]) => String(item[key]) === String(value));
    });

    // Apply Projection to Main Collection
    if (Object.keys(projection).length > 0) {
        filteredResults = filteredResults.map((item: any) => {
            const projectedItem = { ...item };
            Object.entries(projection).forEach(([key, value]) => {
                if (value === 0) delete projectedItem[key]; // Exclude field
            });
            return projectedItem;
        });
    }

    // **Pagination Handling**
    const page = pagination.page || 1; // Default to page 1
    const limit = pagination.limit || filteredResults.length; // Default: return all
    const totalDocuments = filteredResults.length;
    const startIndex = (page - 1) * limit;
    const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);

    return {
        totalDocuments, // Total records before pagination
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
        data: paginatedResults
    };
}

// Order By
// Function to order results from a collection based on custom field and order
export async function orderBy(
    collection: string,
    sortField: string = "name", // Default field to sort by, you can change it to anything.
    sortOrder: "asc" | "desc" = "asc" // Default sorting order is ascending
) {
    const dbContent = await readDB();

    // Ensure the collection exists
    if (!dbContent[collection]) {
        throw new Error(`Collection ${collection} not found`);
    }

    // Fetch all items from the collection
    let results = dbContent[collection];

    // Perform sorting based on the specified field and order
    results.sort((a: any, b: any) => {
        const fieldA = a[sortField];
        const fieldB = b[sortField];

        if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
        if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    return results; // Return sorted results
}