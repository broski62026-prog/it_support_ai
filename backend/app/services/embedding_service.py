
from fastembed import TextEmbedding

_model = None


def get_embedding_model():
    global _model

    if _model is None:
        print("Loading embedding model...")
        _model = TextEmbedding(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        print("Embedding model loaded.")

    return _model


def generate_embedding(text: str) -> list[float]:
    model = get_embedding_model()

    embeddings = model.embed([text])
    vector = list(next(iter(embeddings)))

    return vector
