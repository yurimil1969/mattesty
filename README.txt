TESTY MATEMATYCZNE — GitHub Pages + automatyczna lista testów

1. Na github.com utwórz PUBLICZNE repozytorium, np. testy-matematyczne.
2. Prześlij ZAWARTOŚĆ folderu testy-online do głównego katalogu repozytorium
   (index.html musi znaleźć się w jego katalogu głównym).
3. W Settings > Pages: Deploy from a branch, main, /(root), Save.
4. Wejdź na https://TWOJ-LOGIN.github.io/testy-matematyczne/
   W tej formie adresu owner i repo zostaną wykryte AUTOMATYCZNIE.
5. Gdy używasz własnej domeny, edytuj config.js i wpisz owner oraz repo.
6. Aby dodać nowy test, dodaj folder, np. testy/potegi/test.txt.
   Zdjęcia .png, .svg umieszczaj w tym samym folderze.
   NIE edytujesz żadnego lista.json. Lista pochodzi z publicznego GitHub API.

UWAGA: Domyślna gałąź w config.js to main. Jeśli publikujesz z innej,
zmień wartość branch. Jeśli GitHub Pages publikuje z podkatalogu, strona
musi być dostosowana (obecny projekt zakłada /(root)).

Próby lokalne:
- W config.js wpisz owner i repo, bo adres localhost nie pozwala ich odgadnąć.
- Uruchom w katalogu strony: py -m http.server 8000
- Otwórz http://localhost:8000
- Lista testów pochodzi z GitHub, a testy przy lokalnym podglądzie z lokalnego folderu.

FORMAT test.txt — między zadaniami pusty wiersz:
@ABC
Treść z LaTeX: $$\\frac{1}{2}$$
A: Odpowiedź pierwsza
B: Odpowiedź druga
C: Odpowiedź trzecia
D: Odpowiedź czwarta
POPRAWNA: A

@PF
Oceń zdania.
1: Zdanie pierwsze. | P
2: Zdanie drugie. | F

@UZ
Treść pytania z obrazkiem: ![Trójkąt](trojkat.svg)
A: Własność pierwsza
B: Własność druga
1: Uzasadnienie pierwsze
2: Uzasadnienie drugie
3: Uzasadnienie trzecie
POPRAWNA: A1

Losowane są odpowiedzi ABC, kolejność zdań PF oraz osobno części A/B i 1/2/3.
Każde zadanie ma 1 pkt, tylko za odpowiedź całkowicie poprawną.
MathJax jest ładowany przez Internet.

OGRANICZENIA:
- GitHub API może ograniczyć liczbę zapytań (publiczne zapytania bez logowania).
  Wynik listy jest buforowany 10 minut w obrębie karty przeglądarki.
- Nowy test musi być także opublikowany na GitHub Pages; po dodaniu plików
  może wystąpić krótka zwłoka pomiędzy aktualizacją API a publikacją strony.
- Publiczne pliki TXT zawierają poprawne odpowiedzi — nie jest to rozwiązanie
  do nadzorowanych sprawdzianów.
- Nazwy folderów służą jako nazwy testów (podkreślenia i myślniki zamieniane
  są na spacje). Test musi leżeć bezpośrednio w testy/NAZWA/test.txt.
