Module Program
    Sub Main()
        Dim numbers As Integer() = {1, 2, 3, 4, 5}

        For Each num In numbers
            Console.WriteLine($"Number: {num}")
        Next

        Dim sum = numbers.Sum()
        Console.WriteLine($"Sum: {sum}")
    End Sub
End Module
