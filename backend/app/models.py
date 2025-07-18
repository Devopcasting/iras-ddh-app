from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Time
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin' or 'operator'
    station_code = Column(String, nullable=True)  # Station code for operators
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, unique=True, index=True, nullable=False)
    train_name = Column(String, nullable=False)
    start_station = Column(String, nullable=False)
    end_station = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to stations
    stations = relationship("Station", back_populates="train", cascade="all, delete-orphan")

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    station_name = Column(String, nullable=False)
    station_code = Column(String, nullable=False)  # Station code like NDLS, BCT, etc.
    platform_number = Column(String, nullable=False)
    sequence_order = Column(Integer, nullable=False)  # To maintain station order
    
    # Relationship to train
    train = relationship("Train", back_populates="stations") 

class StationMaster(Base):
    __tablename__ = "station_master"

    id = Column(Integer, primary_key=True, index=True)
    station_name = Column(String, nullable=False)
    station_code = Column(String, unique=True, index=True, nullable=False)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class StateLanguageMapping(Base):
    __tablename__ = "state_language_mapping"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String, unique=True, index=True, nullable=False)
    language = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 

class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    filename = Column(String, nullable=False, unique=True)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    duration = Column(Integer, nullable=True)  # Duration in seconds
    language = Column(String, nullable=False)  # Language of the audio
    text_content = Column(String, nullable=False)  # Original text used to generate audio
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user
    creator = relationship("User")

class MultiLanguageAudioFile(Base):
    __tablename__ = "multi_language_audio_files"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    original_text = Column(String, nullable=False)  # Original English text
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user
    creator = relationship("User")
    # Relationship to language versions
    language_versions = relationship("MultiLanguageAudioVersion", back_populates="parent_audio", cascade="all, delete-orphan")

class MultiLanguageAudioVersion(Base):
    __tablename__ = "multi_language_audio_versions"

    id = Column(Integer, primary_key=True, index=True)
    parent_audio_id = Column(Integer, ForeignKey("multi_language_audio_files.id"), nullable=False)
    language_code = Column(String, nullable=False)  # 'en', 'hi', 'mr', 'gu'
    language_name = Column(String, nullable=False)  # 'English', 'Hindi', 'Marathi', 'Gujarati'
    translated_text = Column(String, nullable=False)  # Translated text
    filename = Column(String, nullable=False, unique=True)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    duration = Column(Integer, nullable=True)  # Duration in seconds
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to parent audio file
    parent_audio = relationship("MultiLanguageAudioFile", back_populates="language_versions")

class AnnouncementTemplate(Base):
    __tablename__ = "announcement_templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # 'arrival', 'departure', 'delay', 'platform_change', 'general'
    template_text = Column(String, nullable=False)  # Template text with placeholders
    audio_file_path = Column(String, nullable=True)  # Path to pre-recorded audio file
    filename = Column(String, nullable=True, unique=True)  # Audio filename
    file_size = Column(Integer, nullable=True)  # Size in bytes
    duration = Column(Integer, nullable=True)  # Duration in seconds
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user
    creator = relationship("User")
    # Relationship to placeholders
    placeholders = relationship("TemplatePlaceholder", back_populates="template", cascade="all, delete-orphan")

class TemplatePlaceholder(Base):
    __tablename__ = "template_placeholders"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("announcement_templates.id"), nullable=False)
    placeholder_name = Column(String, nullable=False)  # 'train_number', 'platform_number', etc.
    placeholder_type = Column(String, nullable=False)  # 'text', 'number', 'time', 'station'
    is_required = Column(Boolean, default=True)
    default_value = Column(String, nullable=True)
    description = Column(String, nullable=True)  # Description of what this placeholder is for
    
    # Relationship to template
    template = relationship("AnnouncementTemplate", back_populates="placeholders")

class GeneratedAnnouncement(Base):
    __tablename__ = "generated_announcements"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("announcement_templates.id"), nullable=False)
    title = Column(String, nullable=False)
    final_text = Column(String, nullable=False)  # Final text with placeholders filled
    audio_file_path = Column(String, nullable=True)  # Path to generated audio file
    filename = Column(String, nullable=True, unique=True)  # Audio filename
    file_size = Column(Integer, nullable=True)  # Size in bytes
    duration = Column(Integer, nullable=True)  # Duration in seconds
    placeholder_values = Column(String, nullable=False)  # JSON string of placeholder values
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    station_code = Column(String, nullable=True)  # Station where announcement was created
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user and template
    creator = relationship("User")
    template = relationship("AnnouncementTemplate") 