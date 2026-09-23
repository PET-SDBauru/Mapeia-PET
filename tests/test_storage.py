# -*- coding: utf-8 -*-
"""
Testes do pacote storage (backend local + validação).
Rodar na raiz do projeto:  python -m unittest discover tests
"""

import tempfile
import unittest

from storage import LocalBackend, UploadError, upload
from storage.base import build_storage_path

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
PDF = b"%PDF-1.7\n" + b"\x00" * 32


class LocalStorageTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.store = LocalBackend(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def _upload(self, data=PNG, name="foto.png", ubs="ubs_a"):
        return upload(self.store, data, name, unidade_id=ubs, unidade_nome=ubs.upper(),
                      category="FOTO_EQUIPAMENTO", description="teste")

    def test_upload_read_roundtrip(self):
        meta = self._upload()
        self.assertEqual(meta.content_type, "image/png")
        self.assertTrue(meta.is_image)
        self.assertEqual(self.store.read(meta.id), PNG)
        self.assertEqual(self.store.get(meta.id), meta)

    def test_mesmo_nome_nao_sobrescreve(self):
        a = self._upload()
        b = self._upload(data=PNG + b"x")
        self.assertNotEqual(a.storage_path, b.storage_path)
        self.assertEqual(self.store.read(a.id), PNG)
        self.assertEqual(len(self.store.list("ubs_a")), 2)

    def test_list_filtra_por_unidade(self):
        self._upload(ubs="ubs_a")
        self._upload(data=PDF, name="rel.pdf", ubs="ubs_b")
        self.assertEqual([f.unidade_id for f in self.store.list("ubs_b")], ["ubs_b"])
        self.assertEqual(len(self.store.list()), 2)

    def test_persiste_entre_instancias(self):
        meta = self._upload()
        reaberto = LocalBackend(self._tmp.name)
        self.assertEqual(reaberto.read(meta.id), PNG)

    def test_delete(self):
        meta = self._upload()
        self.store.delete(meta.id)
        self.assertIsNone(self.store.get(meta.id))
        self.assertEqual(self.store.list(), [])
        self.store.delete(meta.id)  # idempotente

    def test_rejeita_extensao_trocada(self):
        with self.assertRaises(UploadError):
            self._upload(data=b"MZ\x90\x00executavel", name="virus.jpg")

    def test_rejeita_formato_nao_permitido(self):
        with self.assertRaises(UploadError):
            self._upload(data=b"abc", name="script.sh")

    def test_rejeita_vazio(self):
        with self.assertRaises(UploadError):
            self._upload(data=b"")

    def test_caminho_sanitizado(self):
        path = build_storage_path("../../etc", "abc", "../passwd.png")
        # "/" vira "_", então o caminho continua com exatamente 3 níveis
        # e nenhum segmento é ".." (não escapa da pasta da unidade).
        segmentos = path.split("/")
        self.assertEqual(len(segmentos), 3)
        self.assertEqual(segmentos[0], "unidades_saude")
        self.assertNotIn("..", segmentos)


if __name__ == "__main__":
    unittest.main()
