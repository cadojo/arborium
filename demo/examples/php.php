<?php

class User {
    public function __construct(
        private string $name,
        private int $age
    ) {}

    public function greet(): string {
        return "Hello, {$this->name}!";
    }
}

$user = new User('Alice', 30);
echo $user->greet();
