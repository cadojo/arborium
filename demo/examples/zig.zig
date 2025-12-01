const std = @import("std");

fn fibonacci(n: usize) []u64 {
    var result = std.ArrayList(u64).init(std.heap.page_allocator);
    var a: u64 = 0;
    var b: u64 = 1;

    for (0..n) |_| {
        result.append(a) catch unreachable;
        const temp = a + b;
        a = b;
        b = temp;
    }

    return result.toOwnedSlice() catch unreachable;
}

pub fn main() void {
    const fib = fibonacci(10);
    std.debug.print("{any}\n", .{fib});
}
