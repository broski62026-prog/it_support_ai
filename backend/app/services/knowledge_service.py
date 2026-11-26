
from app.models.knowledge_solution import KnowledgeSolution
from app.services.embedding_service import generate_embedding


# Maximum allowed cosine distance for accepting a match.
# Lower distance means more similar.
SIMILARITY_THRESHOLD = 0.25


def search_knowledge(db, question: str):
    query_vector = generate_embedding(question)

    distance = KnowledgeSolution.embedding.cosine_distance(query_vector)

    result = (
        db.query(KnowledgeSolution, distance.label("distance"))
        .filter(KnowledgeSolution.is_verified == True)
        .order_by(distance)
        .first()
    )

    if result is None:
        return None

    knowledge, score = result

    # Reject matches that are not sufficiently similar.
    if score > SIMILARITY_THRESHOLD:
        return None

    return {
        "issue_description": knowledge.issue_description,
        "solution": knowledge.solution,
        "distance": float(score),
    }
