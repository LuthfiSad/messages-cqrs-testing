import elasticClient from '../elastic/elasticClient.js';

export const search = async (query) => {
  const searchParams = {
    index: 'videos',
    size: 30,
    // from: 1,
    query: {},
  };

  if (query) {
    searchParams.query = {
      multi_match: {
        query,
        fields: ['title', 'description', 'category', 'uploader']
      }
    };
  } else {
    searchParams.query = {
      // random_score: { seed: 'random' },
      match_all: {}
    };
  }

  try {
    const response = await elasticClient.search(searchParams);

    // Log respons dari Elasticsearch untuk memastikan `body` ada
    console.log(response);

    // Cek apakah `body` dan `hits` tersedia di dalam response
    if (response && response.hits) {
      return response.hits.hits.map(hit => hit._source);
    } else {
      // Jika tidak ada hits, kembalikan array kosong
      return [];
    }
  } catch (error) {
    console.error("Elasticsearch query error:", error);
    throw new Error("Error querying Elasticsearch");
  }
};

export const searchByTitleForRecommendation = async (query) => {
  console.log(query);

  const searchParams = {
    index: 'videos',
    size: 30,
    // from: 1,
    query: {},
  };
  if (query) {
    searchParams.query = {
      match_phrase_prefix: {
        title: query
      }
    };
  }

  try {
    const response = await elasticClient.search(searchParams);
    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.error("Elasticsearch query error:", error);
    throw new Error("Error querying Elasticsearch");
  }
}

export const searchById = async (id) => {
  try {
    const response = await elasticClient.get({ index: 'videos', id });

    return response._source;
  } catch (error) {
    console.error("Elasticsearch query error:", error);
    throw new Error("Error querying Elasticsearch");
  }
};

export async function handleMessage(message) {
  const { action, data } = message;

  try {
    if (action === 'CREATE') {
      await elasticClient.index({ index: 'videos', id: data.id, document: data });
    } else if (action === 'UPDATE') {
      await elasticClient.update({ index: 'videos', id: data.id, doc: data });
    } else if (action === 'DELETE') {
      await elasticClient.delete({ index: 'videos', id: data.id });
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error(`Error handling ${action} for ID ${data.id}:`, error);
    throw error; // Rethrow error to trigger retry or DLQ logic
  }
}