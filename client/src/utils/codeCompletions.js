// Programming language keywords and built-in completions for proctored code editor

export const LANGUAGE_COMPLETIONS = {
  python: [
    { label: 'def', kind: 'keyword', detail: 'def function_name(params):' },
    { label: 'return', kind: 'keyword', detail: 'return value' },
    { label: 'if', kind: 'keyword', detail: 'if condition:' },
    { label: 'elif', kind: 'keyword', detail: 'elif condition:' },
    { label: 'else', kind: 'keyword', detail: 'else:' },
    { label: 'for', kind: 'keyword', detail: 'for item in iterable:' },
    { label: 'while', kind: 'keyword', detail: 'while condition:' },
    { label: 'in', kind: 'keyword', detail: 'item in sequence' },
    { label: 'import', kind: 'keyword', detail: 'import module' },
    { label: 'from', kind: 'keyword', detail: 'from module import ...' },
    { label: 'class', kind: 'keyword', detail: 'class ClassName:' },
    { label: 'print', kind: 'function', detail: 'print(*values, sep=" ", end="\\n")' },
    { label: 'range', kind: 'function', detail: 'range(start, stop, step)' },
    { label: 'len', kind: 'function', detail: 'len(obj)' },
    { label: 'append', kind: 'method', detail: 'list.append(item)' },
    { label: 'extend', kind: 'method', detail: 'list.extend(iterable)' },
    { label: 'pop', kind: 'method', detail: 'list.pop(index)' },
    { label: 'split', kind: 'method', detail: 'str.split(separator)' },
    { label: 'strip', kind: 'method', detail: 'str.strip()' },
    { label: 'join', kind: 'method', detail: 'sep.join(iterable)' },
    { label: 'input', kind: 'function', detail: 'input(prompt)' },
    { label: 'int', kind: 'type', detail: 'int(x, base=10)' },
    { label: 'str', kind: 'type', detail: 'str(object="")' },
    { label: 'float', kind: 'type', detail: 'float(x)' },
    { label: 'bool', kind: 'type', detail: 'bool(x)' },
    { label: 'list', kind: 'type', detail: 'list(iterable)' },
    { label: 'dict', kind: 'type', detail: 'dict(**kwargs)' },
    { label: 'set', kind: 'type', detail: 'set(iterable)' },
    { label: 'tuple', kind: 'type', detail: 'tuple(iterable)' },
    { label: 'True', kind: 'constant', detail: 'Boolean True' },
    { label: 'False', kind: 'constant', detail: 'Boolean False' },
    { label: 'None', kind: 'constant', detail: 'NoneType singleton' },
    { label: 'sorted', kind: 'function', detail: 'sorted(iterable, key=None, reverse=False)' },
    { label: 'sort', kind: 'method', detail: 'list.sort(key=None, reverse=False)' },
    { label: 'sum', kind: 'function', detail: 'sum(iterable, start=0)' },
    { label: 'min', kind: 'function', detail: 'min(iterable, *[, default=obj, key=func])' },
    { label: 'max', kind: 'function', detail: 'max(iterable, *[, default=obj, key=func])' },
    { label: 'enumerate', kind: 'function', detail: 'enumerate(iterable, start=0)' },
    { label: 'zip', kind: 'function', detail: 'zip(*iterables)' },
    { label: 'map', kind: 'function', detail: 'map(function, iterable)' },
    { label: 'filter', kind: 'function', detail: 'filter(function, iterable)' },
    { label: 'sys', kind: 'module', detail: 'import sys' },
    { label: 'math', kind: 'module', detail: 'import math' },
    { label: 'collections', kind: 'module', detail: 'import collections' },
    { label: 'defaultdict', kind: 'class', detail: 'collections.defaultdict(default_factory)' },
    { label: 'Counter', kind: 'class', detail: 'collections.Counter(iterable)' },
    { label: 'heapq', kind: 'module', detail: 'import heapq' }
  ],
  java: [
    { label: 'public', kind: 'keyword', detail: 'public access modifier' },
    { label: 'private', kind: 'keyword', detail: 'private access modifier' },
    { label: 'protected', kind: 'keyword', detail: 'protected access modifier' },
    { label: 'static', kind: 'keyword', detail: 'static class member' },
    { label: 'void', kind: 'keyword', detail: 'void return type' },
    { label: 'main', kind: 'method', detail: 'public static void main(String[] args)' },
    { label: 'class', kind: 'keyword', detail: 'class ClassName' },
    { label: 'String', kind: 'type', detail: 'java.lang.String' },
    { label: 'int', kind: 'type', detail: '32-bit signed integer' },
    { label: 'boolean', kind: 'type', detail: 'true or false' },
    { label: 'double', kind: 'type', detail: '64-bit floating point' },
    { label: 'long', kind: 'type', detail: '64-bit integer' },
    { label: 'char', kind: 'type', detail: '16-bit Unicode character' },
    { label: 'return', kind: 'keyword', detail: 'return statement' },
    { label: 'if', kind: 'keyword', detail: 'if (condition)' },
    { label: 'else', kind: 'keyword', detail: 'else statement' },
    { label: 'for', kind: 'keyword', detail: 'for (init; cond; step)' },
    { label: 'while', kind: 'keyword', detail: 'while (condition)' },
    { label: 'new', kind: 'keyword', detail: 'new Constructor()' },
    { label: 'import', kind: 'keyword', detail: 'import package.Class;' },
    { label: 'Scanner', kind: 'class', detail: 'java.util.Scanner sc = new Scanner(System.in);' },
    { label: 'System', kind: 'class', detail: 'java.lang.System' },
    { label: 'println', kind: 'method', detail: 'System.out.println(...);' },
    { label: 'print', kind: 'method', detail: 'System.out.print(...);' },
    { label: 'ArrayList', kind: 'class', detail: 'new ArrayList<Type>()' },
    { label: 'List', kind: 'interface', detail: 'java.util.List<Type>' },
    { label: 'HashMap', kind: 'class', detail: 'new HashMap<Key, Value>()' },
    { label: 'Map', kind: 'interface', detail: 'java.util.Map<Key, Value>' },
    { label: 'HashSet', kind: 'class', detail: 'new HashSet<Type>()' },
    { label: 'Set', kind: 'interface', detail: 'java.util.Set<Type>' },
    { label: 'Math', kind: 'class', detail: 'java.lang.Math' },
    { label: 'Arrays', kind: 'class', detail: 'java.util.Arrays' },
    { label: 'Collections', kind: 'class', detail: 'java.util.Collections' },
    { label: 'Integer', kind: 'class', detail: 'java.lang.Integer' },
    { label: 'length', kind: 'property', detail: 'array.length or string.length()' },
    { label: 'size', kind: 'method', detail: 'collection.size()' },
    { label: 'add', kind: 'method', detail: 'list.add(element)' },
    { label: 'get', kind: 'method', detail: 'list.get(index) or map.get(key)' },
    { label: 'put', kind: 'method', detail: 'map.put(key, value)' },
    { label: 'contains', kind: 'method', detail: 'collection.contains(element)' },
    { label: 'charAt', kind: 'method', detail: 'str.charAt(index)' },
    { label: 'substring', kind: 'method', detail: 'str.substring(begin, end)' }
  ],
  cpp: [
    { label: 'include', kind: 'keyword', detail: '#include <header>' },
    { label: 'iostream', kind: 'header', detail: '#include <iostream>' },
    { label: 'vector', kind: 'class', detail: 'std::vector<T>' },
    { label: 'string', kind: 'class', detail: 'std::string' },
    { label: 'map', kind: 'class', detail: 'std::map<Key, Value>' },
    { label: 'unordered_map', kind: 'class', detail: 'std::unordered_map<Key, Value>' },
    { label: 'set', kind: 'class', detail: 'std::set<T>' },
    { label: 'unordered_set', kind: 'class', detail: 'std::unordered_set<T>' },
    { label: 'algorithm', kind: 'header', detail: '#include <algorithm>' },
    { label: 'queue', kind: 'class', detail: 'std::queue<T>' },
    { label: 'priority_queue', kind: 'class', detail: 'std::priority_queue<T>' },
    { label: 'stack', kind: 'class', detail: 'std::stack<T>' },
    { label: 'int', kind: 'type', detail: 'Integer primitive' },
    { label: 'long', kind: 'type', detail: 'Long integer' },
    { label: 'double', kind: 'type', detail: 'Double floating point' },
    { label: 'bool', kind: 'type', detail: 'Boolean primitive' },
    { label: 'char', kind: 'type', detail: 'Character primitive' },
    { label: 'void', kind: 'type', detail: 'Void type' },
    { label: 'auto', kind: 'keyword', detail: 'Automatic type deduction' },
    { label: 'return', kind: 'keyword', detail: 'return statement' },
    { label: 'cin', kind: 'object', detail: 'std::cin >> var;' },
    { label: 'cout', kind: 'object', detail: 'std::cout << val << std::endl;' },
    { label: 'endl', kind: 'object', detail: 'std::endl' },
    { label: 'push_back', kind: 'method', detail: 'vector.push_back(val)' },
    { label: 'emplace_back', kind: 'method', detail: 'vector.emplace_back(args...)' },
    { label: 'size', kind: 'method', detail: 'container.size()' },
    { label: 'begin', kind: 'method', detail: 'container.begin()' },
    { label: 'end', kind: 'method', detail: 'container.end()' },
    { label: 'sort', kind: 'function', detail: 'std::sort(begin, end)' },
    { label: 'min', kind: 'function', detail: 'std::min(a, b)' },
    { label: 'max', kind: 'function', detail: 'std::max(a, b)' },
    { label: 'swap', kind: 'function', detail: 'std::swap(a, b)' },
    { label: 'using', kind: 'keyword', detail: 'using namespace std;' },
    { label: 'namespace', kind: 'keyword', detail: 'namespace name { ... }' },
    { label: 'struct', kind: 'keyword', detail: 'struct StructName { ... };' }
  ],
  c: [
    { label: 'include', kind: 'keyword', detail: '#include <header>' },
    { label: 'stdio.h', kind: 'header', detail: '#include <stdio.h>' },
    { label: 'stdlib.h', kind: 'header', detail: '#include <stdlib.h>' },
    { label: 'string.h', kind: 'header', detail: '#include <string.h>' },
    { label: 'math.h', kind: 'header', detail: '#include <math.h>' },
    { label: 'printf', kind: 'function', detail: 'printf("format", ...);' },
    { label: 'scanf', kind: 'function', detail: 'scanf("format", &var);' },
    { label: 'malloc', kind: 'function', detail: 'malloc(size_in_bytes)' },
    { label: 'free', kind: 'function', detail: 'free(pointer)' },
    { label: 'sizeof', kind: 'operator', detail: 'sizeof(type_or_expr)' },
    { label: 'int', kind: 'type', detail: 'Integer primitive' },
    { label: 'char', kind: 'type', detail: 'Character primitive' },
    { label: 'float', kind: 'type', detail: 'Single precision float' },
    { label: 'double', kind: 'type', detail: 'Double precision float' },
    { label: 'void', kind: 'type', detail: 'Void type' },
    { label: 'return', kind: 'keyword', detail: 'return statement' },
    { label: 'struct', kind: 'keyword', detail: 'struct Name { ... };' },
    { label: 'typedef', kind: 'keyword', detail: 'typedef type alias;' }
  ],
  csharp: [
    { label: 'using', kind: 'keyword', detail: 'using System;' },
    { label: 'namespace', kind: 'keyword', detail: 'namespace App { ... }' },
    { label: 'class', kind: 'keyword', detail: 'class Program { ... }' },
    { label: 'static', kind: 'keyword', detail: 'static modifier' },
    { label: 'void', kind: 'keyword', detail: 'void return type' },
    { label: 'Main', kind: 'method', detail: 'static void Main(string[] args)' },
    { label: 'string', kind: 'type', detail: 'System.String' },
    { label: 'int', kind: 'type', detail: 'System.Int32' },
    { label: 'bool', kind: 'type', detail: 'System.Boolean' },
    { label: 'double', kind: 'type', detail: 'System.Double' },
    { label: 'Console', kind: 'class', detail: 'System.Console' },
    { label: 'WriteLine', kind: 'method', detail: 'Console.WriteLine(...);' },
    { label: 'ReadLine', kind: 'method', detail: 'Console.ReadLine()' },
    { label: 'List', kind: 'class', detail: 'List<T>' },
    { label: 'Dictionary', kind: 'class', detail: 'Dictionary<TKey, TValue>' },
    { label: 'return', kind: 'keyword', detail: 'return statement' },
    { label: 'foreach', kind: 'keyword', detail: 'foreach (var item in list)' }
  ],
  kotlin: [
    { label: 'fun', kind: 'keyword', detail: 'fun name(params): ReturnType' },
    { label: 'val', kind: 'keyword', detail: 'Read-only variable' },
    { label: 'var', kind: 'keyword', detail: 'Mutable variable' },
    { label: 'main', kind: 'function', detail: 'fun main()' },
    { label: 'println', kind: 'function', detail: 'println(...)' },
    { label: 'print', kind: 'function', detail: 'print(...)' },
    { label: 'String', kind: 'type', detail: 'kotlin.String' },
    { label: 'Int', kind: 'type', detail: 'kotlin.Int' },
    { label: 'Boolean', kind: 'type', detail: 'kotlin.Boolean' },
    { label: 'Double', kind: 'type', detail: 'kotlin.Double' },
    { label: 'listOf', kind: 'function', detail: 'listOf(elements...)' },
    { label: 'mutableListOf', kind: 'function', detail: 'mutableListOf<T>()' },
    { label: 'mapOf', kind: 'function', detail: 'mapOf(pairs...)' },
    { label: 'return', kind: 'keyword', detail: 'return statement' }
  ]
};

// Extract user-defined identifiers (variables, functions, names) from code
export const extractUserIdentifiers = (code) => {
  if (!code || typeof code !== 'string') return [];
  const words = code.match(/\\b[a-zA-Z_][a-zA-Z0-9_]{1,}\\b/g) || [];
  const distinct = new Set();
  words.forEach((w) => {
    if (w.length >= 2 && !/^\\d+$/.test(w)) {
      distinct.add(w);
    }
  });
  return Array.from(distinct);
};

// Calculate suggestions based on prefix, programming language, and existing user code
export const getCodeSuggestions = (code, cursorIndex, language = 'python') => {
  if (!code || cursorIndex == null || cursorIndex <= 0) {
    return { prefix: '', suggestions: [] };
  }

  const textBefore = code.substring(0, cursorIndex);
  const match = textBefore.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
  if (!match || !match[1]) {
    return { prefix: '', suggestions: [] };
  }

  const prefix = match[1];
  if (prefix.length < 1) {
    return { prefix: '', suggestions: [] };
  }

  const lowerPrefix = prefix.toLowerCase();
  const langKey = (language || 'python').toLowerCase();
  const langItems = LANGUAGE_COMPLETIONS[langKey] || LANGUAGE_COMPLETIONS.python;

  // 1. User variables and functions in current code (excluding exact match of prefix)
  const allUserVars = extractUserIdentifiers(code);
  const userVarSuggestions = allUserVars
    .filter((v) => v.toLowerCase().startsWith(lowerPrefix) && v.toLowerCase() !== lowerPrefix)
    .map((v) => ({
      label: v,
      kind: 'variable',
      detail: 'User Variable'
    }));

  // 2. Language-specific keywords & built-in functions
  const keywordSuggestions = langItems
    .filter((k) => k.label.toLowerCase().startsWith(lowerPrefix) && k.label.toLowerCase() !== lowerPrefix && !allUserVars.includes(k.label));

  // User variables first so they don't have to rewrite their own names repeatedly
  const combined = [...userVarSuggestions, ...keywordSuggestions].slice(0, 8);

  return {
    prefix,
    suggestions: combined
  };
};
