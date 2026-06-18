"""Configuración tipada con Pydantic Settings.

Lee variables de entorno (y un archivo .env si existe). Una sola fuente de
verdad para la config, validada al arrancar: si falta algo o tiene el tipo
equivocado, la app no levanta a ciegas.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Misma base PostgreSQL que usa la capa Node (docker-compose de postgres/).
    pg_url: str = "postgresql://ecommerce:ecommerce@localhost:5433/ecommerce"
    app_name: str = "Ecommerce Analytics Service"


settings = Settings()
