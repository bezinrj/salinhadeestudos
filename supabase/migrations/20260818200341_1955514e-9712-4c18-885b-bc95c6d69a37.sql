DO $$
DECLARE
  v_lei uuid;
  a1 uuid; a2 uuid; a3 uuid; a4 uuid;
BEGIN
  INSERT INTO public.vm_leis (nome, sigla, descricao, categoria, ordem, publicada)
  VALUES ('Lei nº 12.830/2013 - Investigação Criminal pelo Delegado de Polícia', 'Lei 12.830/13',
          'Dispõe sobre a investigação criminal conduzida pelo delegado de polícia.',
          'Legislação Especial', 23, true)
  RETURNING id INTO v_lei;

  INSERT INTO public.vm_artigos (lei_id, numero, rotulo, texto, ordem) VALUES
    (v_lei, '1º', 'Art. 1º', 'Esta Lei dispõe sobre a investigação criminal conduzida pelo delegado de polícia.', 1) RETURNING id INTO a1;
  INSERT INTO public.vm_artigos (lei_id, numero, rotulo, texto, ordem) VALUES
    (v_lei, '2º', 'Art. 2º', 'As funções de polícia judiciária e a apuração de infrações penais exercidas pelo delegado de polícia são de natureza jurídica, essenciais e exclusivas de Estado.', 2) RETURNING id INTO a2;
  INSERT INTO public.vm_artigos (lei_id, numero, rotulo, texto, ordem) VALUES
    (v_lei, '3º', 'Art. 3º', 'O cargo de delegado de polícia é privativo de bacharel em Direito, devendo-lhe ser dispensado o mesmo tratamento protocolar que recebem os magistrados, os membros da Defensoria Pública e do Ministério Público e os advogados.', 3) RETURNING id INTO a3;
  INSERT INTO public.vm_artigos (lei_id, numero, rotulo, texto, ordem) VALUES
    (v_lei, '4º', 'Art. 4º', 'Esta Lei entra em vigor na data de sua publicação.', 4) RETURNING id INTO a4;

  INSERT INTO public.vm_paragrafos (artigo_id, tipo, rotulo, texto, ordem) VALUES
    (a2, 'paragrafo', '§ 1º', 'Ao delegado de polícia, na qualidade de autoridade policial, cabe a condução da investigação criminal por meio de inquérito policial ou outro procedimento previsto em lei, que tem como objetivo a apuração das circunstâncias, da materialidade e da autoria das infrações penais.', 1),
    (a2, 'paragrafo', '§ 2º', 'Durante a investigação criminal, cabe ao delegado de polícia a requisição de perícia, informações, documentos e dados que interessem à apuração dos fatos.', 2),
    (a2, 'paragrafo', '§ 3º', '(VETADO).', 3),
    (a2, 'paragrafo', '§ 4º', 'O inquérito policial ou outro procedimento previsto em lei em curso somente poderá ser avocado ou redistribuído por superior hierárquico, mediante despacho fundamentado, por motivo de interesse público ou nas hipóteses de inobservância dos procedimentos previstos em regulamento da corporação que prejudique a eficácia da investigação.', 4),
    (a2, 'paragrafo', '§ 5º', 'A remoção do delegado de polícia dar-se-á somente por ato fundamentado.', 5),
    (a2, 'paragrafo', '§ 6º', 'O indiciamento, privativo do delegado de polícia, dar-se-á por ato fundamentado, mediante análise técnico-jurídica do fato, que deverá indicar a autoria, materialidade e suas circunstâncias.', 6);
END $$;