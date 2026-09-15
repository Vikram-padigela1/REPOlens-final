from typing import Any

import tree_sitter
import tree_sitter_go
import tree_sitter_java
import tree_sitter_javascript
import tree_sitter_python
import tree_sitter_typescript

LANGUAGES = {
    ".py": tree_sitter.Language(tree_sitter_python.language()),
    ".ts": tree_sitter.Language(tree_sitter_typescript.language_typescript()),
    ".tsx": tree_sitter.Language(tree_sitter_typescript.language_tsx()),
    ".js": tree_sitter.Language(tree_sitter_javascript.language()),
    ".jsx": tree_sitter.Language(tree_sitter_javascript.language()),
    ".java": tree_sitter.Language(tree_sitter_java.language()),
    ".go": tree_sitter.Language(tree_sitter_go.language()),
}

QUERIES = {
    ".py": """
        (function_definition name: (identifier) @name) @function
        (class_definition name: (identifier) @name) @class
    """,
    ".ts": """
        (function_declaration name: (identifier) @name) @function
        (method_definition name: (property_identifier) @name) @function
        (class_declaration name: (type_identifier) @name) @class
        (lexical_declaration
            (variable_declarator
                name: (identifier) @name value: (arrow_function) @function))
    """,
    ".tsx": """
        (function_declaration name: (identifier) @name) @function
        (method_definition name: (property_identifier) @name) @function
        (class_declaration name: (type_identifier) @name) @class
        (lexical_declaration
            (variable_declarator
                name: (identifier) @name value: (arrow_function) @function))
    """,
    ".js": """
        (function_declaration name: (identifier) @name) @function
        (method_definition name: (property_identifier) @name) @function
        (class_declaration name: (identifier) @name) @class
        (lexical_declaration
            (variable_declarator
                name: (identifier) @name value: (arrow_function) @function))
    """,
    ".jsx": """
        (function_declaration name: (identifier) @name) @function
        (method_definition name: (property_identifier) @name) @function
        (class_declaration name: (identifier) @name) @class
        (lexical_declaration
            (variable_declarator
                name: (identifier) @name value: (arrow_function) @function))
    """,
    ".java": """
        (method_declaration name: (identifier) @name) @function
        (class_declaration name: (identifier) @name) @class
    """,
    ".go": """
        (function_declaration name: (identifier) @name) @function
        (method_declaration name: (field_identifier) @name) @function
        (type_declaration) @class
    """,
}


def extract_code_units(
    file_path: str, rel_path: str, ext: str
) -> list[dict[str, Any]]:
    units: list[dict[str, Any]] = []
    if ext not in LANGUAGES:
        return units

    with open(file_path, "rb") as f:
        source_code = f.read()

    lang = LANGUAGES[ext]
    parser = tree_sitter.Parser(lang)
    tree = parser.parse(source_code)

    query_str = QUERIES.get(ext)
    if not query_str:
        return units

    try:
        query = tree_sitter.Query(lang, query_str)
        cursor = tree_sitter.QueryCursor(query)
        matches = cursor.matches(tree.root_node)

        for _match_id, captures in matches:
            is_class = "class" in captures
            node_list = (
                captures.get("class") if is_class else captures.get("function")
            )
            if not node_list:
                continue

            node = node_list[0]
            name_node_list = captures.get("name")

            name = "anonymous"
            if name_node_list:
                s_byte = name_node_list[0].start_byte
                e_byte = name_node_list[0].end_byte
                name_b = source_code[s_byte:e_byte]
                name = name_b.decode("utf8", errors="ignore")

            code_b = source_code[node.start_byte:node.end_byte]
            code = code_b.decode("utf8", errors="ignore")
            start_line = node.start_point[0] + 1
            end_line = node.end_point[0] + 1

            unit = {
                "file_path": rel_path,
                "symbol_name": name,
                "start_line": start_line,
                "end_line": end_line,
                "code": code,
                "language": ext,
                "unit_type": "class" if is_class else "function",
            }
            units.append(unit)

    except Exception as e:
        print(f"Error parsing {rel_path}: {e}")
        units.append(
            {
                "file_path": rel_path,
                "symbol_name": "file_content",
                "start_line": 1,
                "end_line": (
                    source_code.decode("utf8", errors="ignore").count("\n") + 1
                ),
                "code": source_code.decode("utf8", errors="ignore"),
                "language": ext,
                "unit_type": "file",
            }
        )

    return units
