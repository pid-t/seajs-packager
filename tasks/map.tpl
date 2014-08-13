/*map start*/
seajs.production = true;
if(seajs.production){
  seajs.config({
      map : <%= mapJSON %>
  });
}
/*map end*/

/*defaults start*/
seajs.config(
  <%= defaultsConf %>
);
/*defaults end*/