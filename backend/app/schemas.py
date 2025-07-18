from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime, time

class UserBase(BaseModel):
    email: str
    username: str
    role: str
    station_code: Optional[str] = None

    @validator('station_code')
    def validate_station_code_for_operator(cls, v, values):
        if values.get('role') == 'operator' and not v:
            raise ValueError('Station code is mandatory for operators')
        # Allow "ALL" as a special station code for operators
        if values.get('role') == 'operator' and v and v.upper() == 'ALL':
            return 'ALL'
        return v

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str
    role: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

# Train and Station schemas
class StationBase(BaseModel):
    station_name: str
    station_code: str
    platform_number: str
    sequence_order: int

class StationCreate(StationBase):
    pass

class Station(StationBase):
    id: int
    train_id: int

    class Config:
        from_attributes = True

class TrainBase(BaseModel):
    train_number: str
    train_name: str
    start_station: str
    end_station: str

class TrainCreate(TrainBase):
    stations: List[StationCreate]

class TrainUpdate(BaseModel):
    train_name: Optional[str] = None
    start_station: Optional[str] = None
    end_station: Optional[str] = None
    stations: Optional[List[StationCreate]] = None

class Train(TrainBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    stations: List[Station] = []

    class Config:
        from_attributes = True

# Station Master schemas
class StationMasterBase(BaseModel):
    station_name: str
    station_code: str
    state: Optional[str] = None

class StationMasterCreate(StationMasterBase):
    pass

class StationMasterUpdate(BaseModel):
    station_name: Optional[str] = None
    station_code: Optional[str] = None
    state: Optional[str] = None
    is_active: Optional[bool] = None

class StationMaster(StationMasterBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Translation schemas
class TranslationRequest(BaseModel):
    english_text: str
    local_language: str  # 'Gujarati' or 'Marathi'

class TranslationResponse(BaseModel):
    english: str
    hindi: str
    local: str
    local_language: str

# State Language Mapping schemas
class StateLanguageMappingBase(BaseModel):
    state: str
    language: str

class StateLanguageMappingCreate(StateLanguageMappingBase):
    pass

class StateLanguageMappingUpdate(BaseModel):
    language: Optional[str] = None
    is_active: Optional[bool] = None

class StateLanguageMapping(StateLanguageMappingBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Audio File schemas
class AudioFileBase(BaseModel):
    title: str
    description: Optional[str] = None
    language: str
    text_content: str

class AudioFileCreate(AudioFileBase):
    pass

class AudioFileUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    text_content: Optional[str] = None
    is_active: Optional[bool] = None

class AudioFile(AudioFileBase):
    id: int
    filename: str
    file_path: str
    file_size: Optional[int] = None
    duration: Optional[int] = None
    created_by: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[User] = None

    class Config:
        from_attributes = True

# Multi-Language Audio File schemas
class MultiLanguageAudioVersionBase(BaseModel):
    language_code: str
    language_name: str
    translated_text: str

class MultiLanguageAudioVersionCreate(MultiLanguageAudioVersionBase):
    pass

class MultiLanguageAudioVersion(MultiLanguageAudioVersionBase):
    id: int
    parent_audio_id: int
    filename: str
    file_path: str
    file_size: Optional[int] = None
    duration: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MultiLanguageAudioFileBase(BaseModel):
    title: str
    description: Optional[str] = None
    original_text: str

class MultiLanguageAudioFileCreate(MultiLanguageAudioFileBase):
    pass

class MultiLanguageAudioFileUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    original_text: Optional[str] = None
    is_active: Optional[bool] = None

class MultiLanguageAudioFile(MultiLanguageAudioFileBase):
    id: int
    created_by: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[User] = None
    language_versions: List[MultiLanguageAudioVersion] = []

    class Config:
        from_attributes = True 