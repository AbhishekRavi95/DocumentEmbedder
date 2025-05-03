import logging
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# Configure logging
logger = logging.getLogger(__name__)

# Initialize the vectorizer
vectorizer = None

def load_model():
    """Load the TF-IDF vectorizer for generating embeddings."""
    global vectorizer
    try:
        # Using TF-IDF vectorizer as an alternative to transformer models
        vectorizer = TfidfVectorizer(max_features=384)  # 384 dimensions to mimic MiniLM
        logger.info("TF-IDF vectorizer initialized successfully")
        return vectorizer
    except Exception as e:
        logger.error(f"Error initializing vectorizer: {str(e)}")
        raise Exception(f"Failed to initialize TF-IDF vectorizer: {str(e)}")

def generate_embeddings(text):
    """Generate embeddings for the given text using TF-IDF."""
    global vectorizer
    
    if vectorizer is None:
        vectorizer = load_model()
    
    try:
        # For TF-IDF, we need to fit and transform
        if len(text) > 10000:  # If text is very long, split it into chunks
            chunks = [text[i:i+10000] for i in range(0, len(text), 10000)]
            # Fit the vectorizer on all chunks
            vectorizer.fit(chunks)
            # Transform each chunk and average them
            chunk_vectors = vectorizer.transform(chunks).toarray()
            return np.mean(chunk_vectors, axis=0)
        else:
            # For a single piece of text, we need to create a list with one item
            vectorizer.fit([text])
            return vectorizer.transform([text]).toarray()[0]
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        raise Exception(f"Failed to generate embeddings: {str(e)}")
