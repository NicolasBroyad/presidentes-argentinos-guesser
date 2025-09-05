let tableContent = `
<div class="tabla-container">
  <table class="tabla" border="1" cellspacing="0" cellpadding="5">
    <tbody>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1826 - 1827</td><td class="nombre-presidente-cell"></td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1854 - 1860</td><td class="nombre-presidente-cell">Justo José de Urquiza</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1860 - 1861</td><td class="nombre-presidente-cell">Santiago Derqui</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1862 - 1868</td><td class="nombre-presidente-cell">Bartolomé Mitre</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1868 - 1874</td><td class="nombre-presidente-cell">Domingo Faustino Sarmiento</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1874 - 1880</td><td class="nombre-presidente-cell">Nicolás Avellaneda</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1880 - 1886</td><td class="nombre-presidente-cell">Julio Argentino Roca</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1886 - 1890</td><td class="nombre-presidente-cell">Miguel Juárez Celman</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1890 - 1892</td><td class="nombre-presidente-cell">Carlos Pellegrini</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1892 - 1895</td><td class="nombre-presidente-cell">Luis Sáenz Peña</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1895 - 1898</td><td class="nombre-presidente-cell">José Evaristo Uriburu</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1898 - 1904</td><td class="nombre-presidente-cell">Julio Argentino Roca</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1904 - 1906</td><td class="nombre-presidente-cell">Manuel Quintana</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1906 - 1910</td><td class="nombre-presidente-cell">José Figueroa Alcorta</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1910 - 1914</td><td class="nombre-presidente-cell">Roque Sáenz Peña</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1914 - 1916</td><td class="nombre-presidente-cell">Victorino de la Plaza</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1916 - 1922</td><td class="nombre-presidente-cell">Hipólito Yrigoyen</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1922 - 1928</td><td class="nombre-presidente-cell">Marcelo T. de Alvear</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1928 - 1930</td><td class="nombre-presidente-cell">Hipólito Yrigoyen</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1930 - 1932</td><td class="nombre-presidente-cell">José Félix Uriburu</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1932 - 1938</td><td class="nombre-presidente-cell">Agustín P. Justo</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1938 - 1942</td><td class="nombre-presidente-cell">Roberto M. Ortiz</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1942 - 1943</td><td class="nombre-presidente-cell">Ramón Castillo</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1943 - 1944</td><td class="nombre-presidente-cell">Arturo Rawson</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1943 - 1944</td><td class="nombre-presidente-cell">Pedro Pablo Ramírez</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1944 - 1946</td><td class="nombre-presidente-cell">Edelmiro Julián Farrell</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1946 - 1955</td><td class="nombre-presidente-cell">Juan Domingo Perón</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1955 - 1955</td><td class="nombre-presidente-cell">Eduardo Lonardi</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1955 - 1958</td><td class="nombre-presidente-cell">Pedro E. Aramburu</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1958 - 1962</td><td class="nombre-presidente-cell">Arturo Frondizi</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1962 - 1963</td><td class="nombre-presidente-cell">José María Guido</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1963 - 1966</td><td class="nombre-presidente-cell">Arturo Humberto Illia</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1966 - 1970</td><td class="nombre-presidente-cell">Juan Carlos Onganía</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1970 - 1971</td><td class="nombre-presidente-cell">Roberto M. Levingston</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1971 - 1973</td><td class="nombre-presidente-cell">Alejandro A. Lanusse</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1973 - 1973</td><td class="nombre-presidente-cell">Héctor José Cámpora</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1973 - 1973</td><td class="nombre-presidente-cell">Raúl Alberto Lastiri</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1973 - 1974</td><td class="nombre-presidente-cell">Juan Domingo Perón</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1974 - 1976</td><td class="nombre-presidente-cell">María E. Martínez</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1976 - 1981</td><td class="nombre-presidente-cell">Jorge Rafael Videla</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1981 - 1981</td><td class="nombre-presidente-cell">Roberto E. Viola</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1981 - 1982</td><td class="nombre-presidente-cell">Leopoldo F. Galtieri</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1982 - 1983</td><td class="nombre-presidente-cell">Reynaldo Bignone</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1983 - 1989</td><td class="nombre-presidente-cell">Raúl Ricardo Alfonsín</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1989 - 1999</td><td class="nombre-presidente-cell">Carlos Saúl Menem</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>1999 - 2001</td><td class="nombre-presidente-cell">Fernando De La Rúa</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>2001 - 2001</td><td class="nombre-presidente-cell">Federico Ramón Puerta</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>2001 - 2001</td><td class="nombre-presidente-cell">Adolfo Rodríguez Saá</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>2001 - 2002</td><td class="nombre-presidente-cell">Eduardo O. Camaño</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>2002 - 2003</td><td class="nombre-presidente-cell">Eduardo A. Duhalde</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>2003 - 2007</td><td class="nombre-presidente-cell">Néstor C. Kirchner</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>2007 - 2015</td><td class="nombre-presidente-cell">Cristina E. Fernández</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>2015 - 2019</td><td class="nombre-presidente-cell">Mauricio Macri</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>2019 - 2023</td><td class="nombre-presidente-cell">Alberto A. Fernández</td></tr>
      <tr><td><div class="imagen-presidente-desconocido-container"><img src="images/presidente-desconocido.png"></div>2023 - ...........</td><td class="nombre-presidente-cell">Javier G. Milei</td></tr>
    </tbody>
  </table>
  <div class="input-container">
      <input type="text" name="" id="" placeholder="Ingrese el presidente...">
      <div class="pluma-image-container">
        <img src="images/pluma-oligarca.png" alt="" class="pluma-image">
      </div>
  </div>
</div>
`;


let header = document.querySelector(".header");
let buttonSection = document.querySelector(".button-section");
let rulesSection = document.querySelector(".rules-section");
let body = document.querySelector("body");
body.addEventListener("click", function(event){
    if(event.target.className === "iniciar-juego-button"){
        buttonSection.remove();
        rulesSection.remove();
        body.style.justifyContent = "flex-start";
        body.style.gap = "2rem";
        body.insertAdjacentHTML("beforeend", tableContent);
        
        let tabla = document.querySelector("table");
        //tabla.scrollIntoView({ behavior: "smooth", block: "center" });
    }
});