"""Servidor de desenvolvimento e API mínima da ConectaTech.

Usa apenas a biblioteca padrão do Python para manter o projeto leve. Em produção,
deve ficar atrás de HTTPS e de um proxy reverso com autenticação e observabilidade.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DATABASE = DATA_DIR / "conectatech.db"
MAX_BODY = 32 * 1024
COURSE_IDS = {"basica", "seguranca", "web", "curriculo", "portfolio", "selecao"}
SESSION_DAYS = 7
COURSES = [
    ("basica", "⌨", "Informática básica", "iniciante", "Use o computador, organize arquivos e navegue com confiança.", 8, "1h 40min", 1),
    ("seguranca", "◉", "Segurança digital", "iniciante", "Proteja suas contas, reconheça golpes e cuide dos seus dados.", 6, "1h 10min", 2),
    ("web", "</>", "Desenvolvimento web", "intermediario", "Crie suas primeiras páginas com HTML, CSS e JavaScript.", 12, "3h 20min", 3),
    ("curriculo", "▤", "Currículo que se destaca", "iniciante", "Apresente suas experiências e habilidades com clareza.", 5, "55min", 4),
    ("portfolio", "◇", "Portfólio profissional", "intermediario", "Organize seus projetos e mostre o que você sabe fazer.", 7, "1h 30min", 5),
    ("selecao", "◎", "Processos seletivos", "iniciante", "Prepare-se para candidaturas, entrevistas e dinâmicas.", 6, "1h 15min", 6),
]
LESSONS = [
    ("basica-1", "basica", "Conhecendo o computador", 1, "Você vai identificar as partes básicas do computador e entender para que cada uma serve.", "O teclado permite escrever e executar atalhos. O mouse ou touchpad move o ponteiro. Arquivos guardam informações e pastas ajudam a organizá-los. Não tenha medo de explorar: ações importantes pedem confirmação e você pode desfazer muitas mudanças.", "Qual item é usado para organizar arquivos?", "Pasta", "Mouse|Pasta|Monitor"),
    ("seguranca-1", "seguranca", "Criando senhas mais seguras", 1, "Aprenda a proteger suas contas com senhas fortes e únicas.", "Use uma senha diferente em cada serviço. Prefira frases longas, ative a verificação em duas etapas e use um gerenciador de senhas confiável. Nunca envie códigos de acesso recebidos por mensagem.", "Qual é a prática mais segura?", "Usar uma senha única por serviço", "Repetir uma senha curta|Usar uma senha única por serviço|Enviar o código de acesso"),
    ("web-1", "web", "Sua primeira página HTML", 1, "Conheça a estrutura que organiza o conteúdo de uma página.", "HTML descreve a estrutura da página. Títulos usam elementos h1 a h6, parágrafos usam p e links usam a. Escolher elementos pelo significado melhora a acessibilidade e facilita a manutenção.", "O que o HTML descreve?", "A estrutura da página", "A velocidade da internet|A estrutura da página|A senha do usuário"),
    ("curriculo-1", "curriculo", "Informações essenciais", 1, "Selecione as informações que ajudam recrutadores a conhecer você.", "Um currículo claro traz contato, objetivo, formação, experiências e habilidades relevantes. Não é necessário informar documentos, estado civil ou foto, salvo exigência legal específica.", "Qual dado deve ser evitado no currículo?", "Número de documento", "Formação|Número de documento|Habilidades"),
    ("portfolio-1", "portfolio", "Escolhendo seus projetos", 1, "Aprenda a selecionar trabalhos que demonstram suas habilidades.", "Escolha poucos projetos relevantes e explique o problema, sua participação, as ferramentas e o resultado. Projetos de estudo também contam quando apresentados com honestidade.", "O que deve acompanhar um projeto?", "Contexto e sua participação", "Apenas uma imagem|Contexto e sua participação|Dados pessoais de clientes"),
    ("selecao-1", "selecao", "Preparação para entrevistas", 1, "Organize exemplos das suas experiências e pratique respostas objetivas.", "Pesquise a organização, revise a vaga e prepare exemplos reais de situações em que aprendeu, colaborou ou resolveu um problema. Você pode pedir que a pergunta seja repetida ou esclarecida.", "O que fazer antes da entrevista?", "Pesquisar a organização", "Inventar experiências|Pesquisar a organização|Compartilhar suas senhas"),
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return f"pbkdf2_sha256${salt.hex()}${digest.hex()}"


def password_matches(password: str, encoded: str) -> bool:
    try:
        _, salt_hex, expected = encoded.split("$", 2)
        actual = password_hash(password, bytes.fromhex(salt_hex)).split("$", 2)[2]
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


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
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY, icon TEXT NOT NULL, title TEXT NOT NULL,
                level TEXT NOT NULL, description TEXT NOT NULL, lessons INTEGER NOT NULL,
                duration TEXT NOT NULL, position INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS lessons (
                id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id),
                title TEXT NOT NULL, position INTEGER NOT NULL, summary TEXT NOT NULL,
                content TEXT NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL,
                options TEXT NOT NULL
            );
            """
        )
        database.executemany("INSERT OR IGNORE INTO courses VALUES (?, ?, ?, ?, ?, ?, ?, ?)", COURSES)
        database.executemany("INSERT OR IGNORE INTO lessons VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", LESSONS)


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
        if route == "/api/me":
            user = self.current_user()
            return self.send_json({"user": dict(user) if user else None})
        if route == "/api/courses":
            with connect() as database:
                rows = database.execute("SELECT id, icon, title, level, description, lessons, duration AS time FROM courses ORDER BY position").fetchall()
            return self.send_json({"courses": [dict(row) for row in rows]})
        if route.startswith("/api/lessons/"):
            lesson_id = route.rsplit("/", 1)[-1]
            with connect() as database:
                row = database.execute("SELECT id, course_id AS courseId, title, summary, content, question, answer, options FROM lessons WHERE id = ?", (lesson_id,)).fetchone()
            if not row:
                return self.send_error_json(HTTPStatus.NOT_FOUND, "Aula não encontrada.")
            lesson = dict(row)
            lesson["options"] = lesson["options"].split("|")
            return self.send_json({"lesson": lesson})
        if route == "/api/progress":
            client_id = self.identity()
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

        if route == "/api/auth/register":
            return self.register(payload)
        if route == "/api/auth/login":
            return self.login(payload)
        if route == "/api/auth/logout":
            token = self.session_token()
            if token:
                with connect() as database:
                    database.execute("DELETE FROM sessions WHERE token_hash = ?", (self.token_hash(token),))
            self.send_response(HTTPStatus.NO_CONTENT)
            self.send_header("Set-Cookie", "ct_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
            self.end_headers()
            return

        client_id = self.identity()
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

    def register(self, payload: dict) -> None:
        name = str(payload.get("name", "")).strip()
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))
        if not 2 <= len(name) <= 80 or "@" not in email or len(email) > 180:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "Informe nome e e-mail válidos.")
        if len(password) < 10 or len(password) > 200:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "A senha deve ter pelo menos 10 caracteres.")
        try:
            with connect() as database:
                cursor = database.execute(
                    "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
                    (name, email, password_hash(password), now_iso()),
                )
                user_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            return self.send_error_json(HTTPStatus.CONFLICT, "Já existe uma conta com este e-mail.")
        self.create_session(user_id, name, email, HTTPStatus.CREATED)

    def login(self, payload: dict) -> None:
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))
        with connect() as database:
            user = database.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", (email,)).fetchone()
        if not user or not password_matches(password, user["password_hash"]):
            return self.send_error_json(HTTPStatus.UNAUTHORIZED, "E-mail ou senha incorretos.")
        self.create_session(user["id"], user["name"], user["email"])

    def create_session(self, user_id: int, name: str, email: str, status: HTTPStatus = HTTPStatus.OK) -> None:
        token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
        with connect() as database:
            database.execute("DELETE FROM sessions WHERE expires_at < ?", (now_iso(),))
            database.execute("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", (self.token_hash(token), user_id, expires.isoformat()))
        content = json.dumps({"user": {"id": user_id, "name": name, "email": email}}, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Set-Cookie", f"ct_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={SESSION_DAYS * 86400}")
        self.end_headers()
        self.wfile.write(content)

    @staticmethod
    def token_hash(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def session_token(self) -> str | None:
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        return cookie["ct_session"].value if "ct_session" in cookie else None

    def current_user(self) -> sqlite3.Row | None:
        token = self.session_token()
        if not token:
            return None
        with connect() as database:
            return database.execute(
                "SELECT users.id, users.name, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?",
                (self.token_hash(token), now_iso()),
            ).fetchone()

    def identity(self) -> str | None:
        user = self.current_user()
        return f"user-{user['id']}" if user else self.client_id()

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
