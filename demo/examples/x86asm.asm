section .text
global _start

_start:
    ; Calculate factorial of 5
    mov ecx, 5          ; n = 5
    mov eax, 1          ; result = 1

.loop:
    imul eax, ecx       ; result *= n
    dec ecx             ; n--
    jnz .loop           ; if n != 0, continue

    ; Exit with result as status
    mov ebx, eax
    mov eax, 1
    int 0x80
