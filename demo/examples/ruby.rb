class Person
  attr_reader :name, :age

  def initialize(name, age)
    @name = name
    @age = age
  end

  def greet
    "Hello, my name is #{name}!"
  end
end

person = Person.new('Alice', 30)
puts person.greet
