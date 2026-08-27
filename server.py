"""Servidor de desenvolvimento e API mínima da ConectaTech.

Usa apenas a biblioteca padrão do Python para manter o projeto leve. Em produção,
deve ficar atrás de HTTPS e de um proxy reverso com autenticação e observabilidade.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DATABASE = DATA_DIR / "conectatech.db"
MAX_BODY = 32 * 1024
COURSE_IDS = {"basica", "seguranca", "web", "curriculo", "portfolio", "selecao"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    with connect() as database:
        database.executescript(
            """
            CREATE TABLE IF NOT EXISTS progress (
                client_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (client_id, course_id)
            );
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id TEXT NOT NULL,
                category TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )


class ConectaTechHandler(SimpleHTTPRequestHandler):
    server_version = "ConectaTech/0.2"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        super().end_headers()

    def do_GET(self) -> None:  # noqa: N802
        route = urlparse(self.path).path
        if route == "/api/health":
            return self.send_json({"status": "ok", "service": "conectatech", "time": now_iso()})
        if route == "/api/progress":
            client_id = self.client_id()
            if not client_id:
                return self.send_error_json(HTTPStatus.BAD_REQUEST, "Identificador do cliente ausente.")
            with connect() as database:
                rows = database.execute(
                    "SELECT course_id, updated_at FROM progress WHERE client_id = ? ORDER BY updated_at",
                    (client_id,),
                ).fetchall()
            return self.send_json({"completed": [row["course_id"] for row in rows]})
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        route = urlparse(self.path).path
        payload = self.read_json()
        if payload is None:
            return
        client_id = self.client_id()
        if not client_id:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "Identificador do cliente ausente.")

        if route == "/api/progress":
            course_id = payload.get("courseId")
            if course_id not in COURSE_IDS:
                return self.send_error_json(HTTPStatus.BAD_REQUEST, "Trilha inválida.")
            with connect() as database:
                database.execute(
                    "INSERT INTO progress (client_id, course_id, updated_at) VALUES (?, ?, ?) "
                    "ON CONFLICT(client_id, course_id) DO UPDATE SET updated_at=excluded.updated_at",
                    (client_id, course_id, now_iso()),
                )
            return self.send_json({"saved": True, "courseId": course_id}, HTTPStatus.CREATED)

        if route == "/api/feedback":
            category = str(payload.get("category", "geral"))[:40]
            message = str(payload.get("message", "")).strip()
            if not message or len(message) > 2000:
                return self.send_error_json(HTTPStatus.BAD_REQUEST, "Mensagem deve ter entre 1 e 2.000 caracteres.")
            with connect() as database:
                cursor = database.execute(
                    "INSERT INTO feedback (client_id, category, message, created_at) VALUES (?, ?, ?, ?)",
                    (client_id, category, message, now_iso()),
                )
            return self.send_json({"saved": True, "protocol": cursor.lastrowid}, HTTPStatus.CREATED)

        self.send_error_json(HTTPStatus.NOT_FOUND, "Rota não encontrada.")

    def client_id(self) -> str | None:
        value = self.headers.get("X-Client-Id", "").strip()
        return value if 8 <= len(value) <= 80 and value.replace("-", "").isalnum() else None

    def read_json(self) -> dict | None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_error_json(HTTPStatus.BAD_REQUEST, "Tamanho da requisição inválido.")
            return None
        if length <= 0 or length > MAX_BODY:
            self.send_error_json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "Requisição vazia ou muito grande.")
            return None
        try:
            payload = json.loads(self.rfile.read(length))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_error_json(HTTPStatus.BAD_REQUEST, "JSON inválido.")
            return None
        if not isinstance(payload, dict):
            self.send_error_json(HTTPStatus.BAD_REQUEST, "O conteúdo deve ser um objeto JSON.")
            return None
        return payload

    def send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        content = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def send_error_json(self, status: HTTPStatus, message: str) -> None:
        self.send_json({"error": message}, status)


def main() -> None:
    parser = argparse.ArgumentParser(description="Executa a ConectaTech localmente.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=4173, type=int)
    args = parser.parse_args()
    initialize_database()
    server = ThreadingHTTPServer((args.host, args.port), ConectaTechHandler)
    print(f"ConectaTech disponível em http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
