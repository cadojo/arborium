; Node names

(base_node name: (string) @type)

; Type annotations

(type) @type
(annotation_type) @type.builtin

; Properties

(prop key: (string) @property)

; Identifiers

(identifier_string) @variable

; Literals

(quoted_string) @string
(raw_string) @string

(escape) @string.escape

(number) @number
(keyword_number) @number.special

(boolean) @boolean

"#null" @constant.builtin

; Operators / punctuation

"=" @operator

["{" "}"] @punctuation.bracket
["(" ")"] @punctuation.bracket

";" @punctuation.delimiter

; Comments

[
  (single_line_comment)
  (multi_line_comment)
] @comment @spell

"/-" @comment

