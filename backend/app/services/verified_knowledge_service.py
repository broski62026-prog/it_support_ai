from app.models.knowledge_solution import KnowledgeSolution
from app.services.embedding_service import generate_embedding


def save_verified_solution(db, issue_description: str, solution: str):
    # Generate embedding for the problem description
    vector = generate_embedding(issue_description)

    # Create verified knowledge record
    knowledge = KnowledgeSolution(
        issue_description=issue_description,
        solution=solution,
        embedding=vector,
        is_verified=True,
    )

    db.add(knowledge)
    db.commit()
    db.refresh(knowledge)

    return knowledge
