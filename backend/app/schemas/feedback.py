from pydantic import BaseModel


class ResolutionFeedback(BaseModel):
    resolved: bool