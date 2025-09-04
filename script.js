let tableContent = `
<table class="tabla" border="1" cellspacing="0" cellpadding="5">
  <thead>
    <tr>
      <th>Mandato</th>
      <th>Presidente</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>1826 - 1827</td><td class="bernardino"><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>Bernardino Rivadavia</td></tr>
    <tr><td>1854 - 1860</td><td>Justo José de Urquiza</td></tr>
    <tr><td>1860 - 1861</td><td>Santiago Derqui</td></tr>
    <tr><td>1862 - 1868</td><td>Bartolomé Mitre</td></tr>
    <tr><td>1868 - 1874</td><td>Domingo Faustino Sarmiento</td></tr>
    <tr><td>1874 - 1880</td><td>Nicolás Avellaneda</td></tr>
    <tr><td>1880 - 1886</td><td>Julio Argentino Roca</td></tr>
    <tr><td>1886 - 1890</td><td>Miguel Juárez Celman</td></tr>
    <tr><td>1890 - 1892</td><td>Carlos Pellegrini</td></tr>
    <tr><td>1892 - 1895</td><td>Luis Sáenz Peña</td></tr>
    <tr><td>1895 - 1898</td><td>José Evaristo Uriburu</td></tr>
    <tr><td>1898 - 1904</td><td>Julio Argentino Roca</td></tr>
    <tr><td>1904 - 1906</td><td>Manuel Quintana</td></tr>
    <tr><td>1906 - 1910</td><td>José Figueroa Alcorta</td></tr>
    <tr><td>1910 - 1914</td><td>Roque Sáenz Peña</td></tr>
    <tr><td>1914 - 1916</td><td>Victorino de la Plaza</td></tr>
    <tr><td>1916 - 1922</td><td>Hipólito Yrigoyen</td></tr>
    <tr><td>1922 - 1928</td><td>Marcelo T. de Alvear</td></tr>
    <tr><td>1928 - 1930</td><td>Hipólito Yrigoyen</td></tr>
    <tr><td>1930 - 1932</td><td>José Félix Uriburu</td></tr>
    <tr><td>1932 - 1938</td><td>Agustín P. Justo</td></tr>
    <tr><td>1938 - 1942</td><td>Roberto M. Ortiz</td></tr>
    <tr><td>1942 - 1943</td><td>Ramón Castillo</td></tr>
    <tr><td>1943 - 1944</td><td>Arturo Rawson</td></tr>
    <tr><td>1943 - 1944</td><td>Pedro Pablo Ramírez</td></tr>
    <tr><td>1944 - 1946</td><td>Edelmiro Julián Farrell</td></tr>
    <tr><td>1946 - 1955</td><td>Juan Domingo Perón</td></tr>
    <tr><td>1955 - 1955</td><td>Eduardo Lonardi</td></tr>
    <tr><td>1955 - 1958</td><td>Pedro E. Aramburu</td></tr>
    <tr><td>1958 - 1962</td><td>Arturo Frondizi</td></tr>
    <tr><td>1962 - 1963</td><td>José María Guido</td></tr>
    <tr><td>1963 - 1966</td><td>Arturo Humberto Illia</td></tr>
    <tr><td>1966 - 1970</td><td>Juan Carlos Onganía</td></tr>
    <tr><td>1970 - 1971</td><td>Roberto M. Levingston</td></tr>
    <tr><td>1971 - 1973</td><td>Alejandro A. Lanusse</td></tr>
    <tr><td>1973 - 1973</td><td>Héctor José Cámpora</td></tr>
    <tr><td>1973 - 1973</td><td>Raúl Alberto Lastiri</td></tr>
    <tr><td>1973 - 1974</td><td>Juan Domingo Perón</td></tr>
    <tr><td>1974 - 1976</td><td>María E. Martínez</td></tr>
    <tr><td>1976 - 1981</td><td>Jorge Rafael Videla</td></tr>
    <tr><td>1981 - 1981</td><td>Roberto E. Viola</td></tr>
    <tr><td>1981 - 1982</td><td>Leopoldo F. Galtieri</td></tr>
    <tr><td>1982 - 1983</td><td>Reynaldo Bignone</td></tr>
    <tr><td>1983 - 1989</td><td>Raúl Ricardo Alfonsín</td></tr>
    <tr><td>1989 - 1999</td><td>Carlos Saúl Menem</td></tr>
    <tr><td>1999 - 2001</td><td>Fernando De La Rúa</td></tr>
    <tr><td>2001 - 2001</td><td>Federico Ramón Puerta</td></tr>
    <tr><td>2001 - 2001</td><td>Adolfo Rodríguez Saá</td></tr>
    <tr><td>2001 - 2002</td><td>Eduardo O. Camaño</td></tr>
    <tr><td>2002 - 2003</td><td>Eduardo A. Duhalde</td></tr>
    <tr><td>2003 - 2007</td><td>Néstor C. Kirchner</td></tr>
    <tr><td>2007 - 2015</td><td>Cristina E. Fernández</td></tr>
    <tr><td>2015 - 2019</td><td>Mauricio Macri</td></tr>
    <tr><td>2019 - 2023</td><td>Alberto A. Fernández</td></tr>
    <tr><td>2023 - actual</td><td>Javier G. Milei</td></tr>
  </tbody>
</table>
`;


let header = document.querySelector(".header");
let buttonSection = document.querySelector(".button-section");
let rulesSection = document.querySelector(".rules-section");
let body = document.querySelector("body");
body.addEventListener("click", function(event){
    if(event.target.className === "iniciar-juego-button"){
        buttonSection.remove();
        rulesSection.remove();
        body.style.height = "150vh";
        body.style.justifyContent = "flex-start";
        body.style.gap = "10rem";
        body.insertAdjacentHTML("beforeend", tableContent);
        
        let tabla = document.querySelector("table");
        tabla.scrollIntoView({ behavior: "smooth", block: "start" });
    }
});