// Aktualizovaná sada urbanistických indikátorů podle požadavků
export const indikatory = [
  // Bilance ploch řešeného území (6 indikátorů)
  {"id":"C01","nazev":"Plocha řešeného území","jednotka":"m²","kategorie":"Bilance ploch řešeného území","popis":"Celková plocha řešeného území.","ikona":"📐","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C02","nazev":"Zastavěná plocha objektů","jednotka":"m²","kategorie":"Bilance ploch řešeného území","popis":"Plochy zastavěné budovami a objekty.","ikona":"🏢","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C03","nazev":"Plochy zelené","jednotka":"m²","kategorie":"Bilance ploch řešeného území","popis":"Zatravněné nezpevněné plochy včetně zelených pásů apod.","ikona":"🌿","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C04","nazev":"Plochy zpevněné","jednotka":"m²","kategorie":"Bilance ploch řešeného území","popis":"Komunikace, chodníky, náměstí.","ikona":"🛣️","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C05","nazev":"Plochy ostatní","jednotka":"m²","kategorie":"Bilance ploch řešeného území","popis":"Vodní plochy a ostatní.","ikona":"💧","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  
  // Bilance HPP dle funkce (8 indikátorů)
  {"id":"C06","nazev":"Celková plocha nadzemních podlaží","jednotka":"m²","kategorie":"Bilance HPP dle funkce","popis":"Celková plocha nadzemních podlaží.","ikona":"🏗️","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C07","nazev":"Celková plocha podzemních podlaží","jednotka":"m²","kategorie":"Bilance HPP dle funkce","popis":"Celková plocha podzemních podlaží.","ikona":"🏗️","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C08","nazev":"HPP bydlení","jednotka":"m²","kategorie":"Bilance HPP dle funkce","popis":"Hlavní podlažní plocha pro bydlení.","ikona":"🏠","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C09","nazev":"HPP komerce / obchod","jednotka":"m²","kategorie":"Bilance HPP dle funkce","popis":"Hlavní podlažní plocha pro komerční účely a obchod.","ikona":"🛒","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C10","nazev":"HPP kanceláře / služby","jednotka":"m²","kategorie":"Bilance HPP dle funkce","popis":"Hlavní podlažní plocha pro kanceláře a služby.","ikona":"🏢","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C11","nazev":"HPP veřejná vybavenost","jednotka":"m²","kategorie":"Bilance HPP dle funkce","popis":"Hlavní podlažní plocha pro veřejnou vybavenost.","ikona":"🏛️","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C12","nazev":"HPP technologie / chodby / zázemí v objektech","jednotka":"m²","kategorie":"Bilance HPP dle funkce","popis":"Hlavní podlažní plocha pro technologie, chodby a zázemí v objektech.","ikona":"⚙️","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  {"id":"C13","nazev":"HPP parkování / komunikace v objektech","jednotka":"m²","kategorie":"Bilance HPP dle funkce","popis":"Hlavní podlažní plocha pro parkování a komunikace v objektech.","ikona":"🅿️","lower_better":false,"comparison_method":"numeric","data_type":"float","vaha":10},
  
  // Bilance parkovacích ploch (4 indikátory)
  {"id":"C14","nazev":"Parkovací stání krytá (nadzemní)","jednotka":"ks","kategorie":"Bilance parkovacích ploch","popis":"Počet krytých nadzemních parkovacích stání.","ikona":"🅿️","lower_better":false,"comparison_method":"numeric","data_type":"integer","vaha":10},
  {"id":"C15","nazev":"Parkovací stání venkovní","jednotka":"ks","kategorie":"Bilance parkovacích ploch","popis":"Počet venkovních parkovacích stání.","ikona":"🅿️","lower_better":false,"comparison_method":"numeric","data_type":"integer","vaha":10},
  {"id":"C16","nazev":"Parkovací stání podzemní","jednotka":"ks","kategorie":"Bilance parkovacích ploch","popis":"Počet podzemních parkovacích stání.","ikona":"🅿️","lower_better":false,"comparison_method":"numeric","data_type":"integer","vaha":10},
  {"id":"C17","nazev":"Parkovací stání celkem","jednotka":"ks","kategorie":"Bilance parkovacích ploch","popis":"Celkový počet parkovacích stání.","ikona":"🅿️","lower_better":false,"comparison_method":"numeric","data_type":"integer","vaha":10}
];

export const kategorie = [
  {"key":"Bilance ploch řešeného území","nazev":"Bilance ploch řešeného území","ikona":"📐","barva":"blue"},
  {"key":"Bilance HPP dle funkce","nazev":"Bilance HPP dle funkce","ikona":"🏗️","barva":"purple"},
  {"key":"Bilance parkovacích ploch","nazev":"Bilance parkovacích ploch","ikona":"🅿️","barva":"orange"}
];




