import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiCamera,
  FiCheck,
  FiHash,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../api/api";

type Produto = {
  id: number;
  nome: string;
  cod_barra?: string | null;
  controla_lote?: boolean;
  controla_validade?: boolean;
  custo_medio?: string | number | null;
};

type ExtendedMediaTrackCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  zoom?: {
    min?: number;
    max?: number;
  } | number;
};

function toNumber(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function formatMoney(v: unknown) {
  return toNumber(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export default function InventarioScanner() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const inventarioInicial = searchParams.get("inventarioId") || "";

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "inventario-scanner-reader";
  const lastReadRef = useRef("");
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  const [inventarioId, setInventarioId] = useState(inventarioInicial);
  const [inventarioConfirmado, setInventarioConfirmado] = useState(!!inventarioInicial);

  const [loadingCamera, setLoadingCamera] = useState(false);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const [codigoLido, setCodigoLido] = useState("");
  const [produto, setProduto] = useState<Produto | null>(null);

  const [quantidade, setQuantidade] = useState("");
  const [lote, setLote] = useState("");
  const [validade, setValidade] = useState("");
  const [observacao, setObservacao] = useState("");

  const [codigoManual, setCodigoManual] = useState("");
  const [ultimoItemAdicionado, setUltimoItemAdicionado] = useState<{
    nome: string;
    quantidade: number;
  } | null>(null);

  type HistoricoLeitura = {
    id: string;
    produto_id: number;
    nome: string;
    codigo: string;
    quantidade: number;
    lote?: string | null;
    validade?: string | null;
    dataHora: string;
  };

  type ExtendedMediaTrackCapabilities = MediaTrackCapabilities & {
    focusMode?: string[];
    zoom?: {
      min?: number;
      max?: number;
    } | number;
  };

  const [historicoItens, setHistoricoItens] = useState<HistoricoLeitura[]>([]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      pararScanner();
    };
  }, []);

  useEffect(() => {
    if (inventarioConfirmado) {
      iniciarScanner();
    }
  }, [inventarioConfirmado]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        pararScanner();
      }
    }

    function handlePageHide() {
      pararScanner();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  useEffect(() => {
    if (inventarioConfirmado) {
      iniciarScanner();
    }
  }, [inventarioConfirmado]);

  function escolherMelhorCamera(devices: MediaDeviceInfo[]) {
    if (!devices.length) return null;

    const ordenadas = [...devices].sort((a, b) => {
      const la = String(a.label || "").toLowerCase();
      const lb = String(b.label || "").toLowerCase();

      const score = (label: string) => {
        let s = 0;
        if (label.includes("back")) s += 5;
        if (label.includes("rear")) s += 5;
        if (label.includes("traseira")) s += 5;
        if (label.includes("wide")) s += 2;
        if (label.includes("ultra")) s -= 1;
        return s;
      };

      return score(lb) - score(la);
    });

    return ordenadas[0]?.deviceId || null;
  }

  function vibrarLeitura() {
    try {
      if ("vibrate" in navigator) {
        navigator.vibrate?.(120);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function escolherMelhorCameraLabel(cameras: Array<{ id: string; label: string }>) {
    if (!cameras.length) return null;

    const ordenadas = [...cameras].sort((a, b) => {
      const la = String(a.label || "").toLowerCase();
      const lb = String(b.label || "").toLowerCase();

      const score = (label: string) => {
        let s = 0;
        if (label.includes("back")) s += 5;
        if (label.includes("rear")) s += 5;
        if (label.includes("traseira")) s += 5;
        if (label.includes("environment")) s += 5;
        if (label.includes("wide")) s += 2;
        if (label.includes("ultra")) s -= 1;
        return s;
      };

      return score(lb) - score(la);
    });

    return ordenadas[0]?.id || null;
  }

  async function iniciarScanner() {
    if (!inventarioConfirmado) return;

    try {
      await pararScanner();

      if (!mountedRef.current) return;

      setLoadingCamera(true);
      setCameraReady(false);

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        toast.error("Nenhuma câmera encontrada");
        return;
      }

      const cameraId = escolherMelhorCameraLabel(cameras);

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        verbose: false,
      });

      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: "environment" },
        {
          fps: 12,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.777778,
          disableFlip: false,
        },
        async (decodedText) => {
          if (!mountedRef.current) return;
          if (processingRef.current) return;

          const codigo = String(decodedText || "").replace(/\s+/g, "").trim();

          if (!codigo) return;
          if (lastReadRef.current === codigo) return;

          processingRef.current = true;
          lastReadRef.current = codigo;

          vibrarLeitura();
          setCodigoLido(codigo);

          await pararScanner();
          await buscarProdutoPorCodigo(codigo);

          processingRef.current = false;
        },
        () => {
          // erros de frame são normais, não fazer nada
        }
      );

      if (mountedRef.current) {
        setCameraReady(true);
      }
    } catch (err: any) {
      console.error("Erro ao iniciar câmera:", err);

      const name = String(err?.name || "");

      if (name === "NotAllowedError") {
        toast.error("Permissão da câmera negada");
      } else if (name === "NotFoundError") {
        toast.error("Nenhuma câmera disponível");
      } else if (name === "NotReadableError") {
        toast.error("A câmera está em uso por outro aplicativo");
      } else {
        toast.error("Não foi possível acessar a câmera");
      }
    } finally {
      if (mountedRef.current) {
        setLoadingCamera(false);
      }
    }
  }

  async function pararScanner() {
    try {
      if (html5QrCodeRef.current) {
        const scannerState = html5QrCodeRef.current.getState?.();

        if (scannerState === 2 || scannerState === 1) {
          await html5QrCodeRef.current.stop();
        }

        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch (err) {
      console.error("Erro ao parar scanner:", err);
    }

    if (mountedRef.current) {
      setCameraReady(false);
    }
  }

  async function buscarCodigoManual() {
    const codigo = String(codigoManual || "").replace(/\s+/g, "").trim();

    if (!codigo) {
      toast.error("Informe um código de barras");
      return;
    }

    lastReadRef.current = codigo;
    setCodigoLido(codigo);
    await pararScanner();
    await buscarProdutoPorCodigo(codigo);
  }

  async function buscarProdutoPorCodigo(codigo: string) {
    try {
      setSearchingProduct(true);
      setProduto(null);

      const codigoNormalizado = String(codigo || "")
        .replace(/\s+/g, "")
        .trim();

      const { data } = await api.get("/produtos", {
        params: {
          cod_barra_exato: codigoNormalizado,
          page: 1,
          limit: 20,
        },
      });

      const lista: Produto[] = Array.isArray(data?.data) ? data.data : [];

      const encontrado = lista.find(
        (p) =>
          String(p.cod_barra || "")
            .replace(/\s+/g, "")
            .trim() === codigoNormalizado
      );

      if (!encontrado) {
        setProduto(null);
        toast.error(`Nenhum produto encontrado para o código ${codigoNormalizado}`);
        return;
      }

      setProduto(encontrado);
      setQuantidade("");
      setLote("");
      setValidade("");
      setObservacao("");
      toast.success("Produto encontrado");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao buscar produto");
    } finally {
      if (mountedRef.current) {
        setSearchingProduct(false);
      }
    }
  }

  async function confirmarInventario() {
    const id = String(inventarioId || "").trim();

    if (!id) {
      toast.error("Informe o ID do inventário");
      return;
    }

    if (Number(id) <= 0) {
      toast.error("Informe um ID válido");
      return;
    }

    setInventarioConfirmado(true);
    setSearchParams({ inventarioId: id });
  }

  async function limparLeitura() {
    setCodigoLido("");
    setProduto(null);
    setQuantidade("");
    setLote("");
    setValidade("");
    setObservacao("");
    lastReadRef.current = "";
    processingRef.current = false;

    await iniciarScanner();
  }

  async function trocarInventario() {
    await pararScanner();
    setInventarioConfirmado(false);
    setInventarioId("");
    setCodigoLido("");
    setProduto(null);
    setQuantidade("");
    setLote("");
    setValidade("");
    setObservacao("");
    lastReadRef.current = "";
    processingRef.current = false;
    setSearchParams({});
  }

  async function adicionarItem() {
    if (!produto) {
      toast.error("Nenhum produto selecionado");
      return;
    }

    if (!inventarioId) {
      toast.error("Informe o inventário");
      return;
    }

    if (!quantidade || toNumber(quantidade, 0) <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }

    if (produto.controla_lote && !lote.trim()) {
      toast.error("Informe o lote");
      return;
    }

    if (produto.controla_validade && !validade) {
      toast.error("Informe a validade");
      return;
    }

    try {
      setSavingItem(true);

      const payload: Record<string, unknown> = {
        produto_id: produto.id,
        quantidade_contada: toNumber(quantidade),
        observacao: observacao.trim() || null,
      };

      if (produto.custo_medio !== null && produto.custo_medio !== undefined) {
        payload.custo_unitario = toNumber(produto.custo_medio);
      }

      if (produto.controla_lote) {
        payload.lote = lote.trim();
      }

      if (produto.controla_validade) {
        payload.validade = validade;
      }

      await api.post(`/inventario/${inventarioId}/itens`, payload);

      registrarHistorico({
        produto_id: produto.id,
        nome: produto.nome,
        codigo: produto.cod_barra,
        quantidade: toNumber(quantidade),
        lote: produto.controla_lote ? lote : null,
        validade: produto.controla_validade ? validade : null,
      });

      setUltimoItemAdicionado({
        nome: produto.nome,
        quantidade: toNumber(quantidade),
      });

      toast.success("Item adicionado ao inventário");

      setCodigoManual("");
      await limparLeitura();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erro ao adicionar item");
    } finally {
      setSavingItem(false);
    }
  }

  function somarQuantidade(valor: number) {
    const atual = toNumber(quantidade, 0);
    setQuantidade(String(atual + valor));
  }

  function limparQuantidade() {
    setQuantidade("");
  }

  function registrarHistorico(item: {
    produto_id: number;
    nome: string;
    codigo?: string | null;
    quantidade: number;
    lote?: string | null;
    validade?: string | null;
  }) {
    const novoItem: HistoricoLeitura = {
      id: `${Date.now()}-${item.produto_id}`,
      produto_id: item.produto_id,
      nome: item.nome,
      codigo: item.codigo || "-",
      quantidade: item.quantidade,
      lote: item.lote || null,
      validade: item.validade || null,
      dataHora: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    setHistoricoItens((prev) => [novoItem, ...prev].slice(0, 10));
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button
          type="button"
          style={styles.backButton}
          onClick={async () => {
            await pararScanner();
            navigate(-1);
          }}
        >
          <FiArrowLeft size={16} style={{ marginRight: 8 }} />
          Voltar
        </button>
      </div>

      <div style={styles.container}>
        <div style={styles.heroCard}>
          <h1 style={styles.title}>Scanner de Inventário</h1>
          <p style={styles.subtitle}>
            Tela otimizada para celular. Informe o inventário, leia o código de barras e adicione os itens de forma rápida.
          </p>
        </div>

        {!inventarioConfirmado && (
          <div style={styles.card}>
            <div style={styles.sectionTitle}>
              <FiHash size={18} style={{ marginRight: 8 }} />
              Informe o inventário
            </div>

            <div style={styles.helpBox}>
              Aponte a câmera para o código de barras.
              <br />
              Mantenha o código dentro da faixa verde.
              <br />
              Se a leitura falhar, afaste um pouco a câmera e tente novamente.
            </div>

            <div style={styles.fieldWrap}>
              <label style={styles.label}>ID do inventário *</label>
              <input
                type="number"
                value={inventarioId}
                onChange={(e) => setInventarioId(e.target.value)}
                placeholder="Ex: 15"
                style={styles.input}
              />
            </div>

            <div style={styles.bottomActions}>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={confirmarInventario}
              >
                <FiCheck size={16} style={{ marginRight: 8 }} />
                Confirmar inventário
              </button>
            </div>
          </div>
        )}

        {inventarioConfirmado && (
          <>
            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>
                  <FiHash size={18} style={{ marginRight: 8 }} />
                  Inventário selecionado
                </div>
                <button
                  type="button"
                  style={styles.linkButton}
                  onClick={trocarInventario}
                >
                  Trocar
                </button>
              </div>

              <div style={styles.inventoryBadge}>Inventário #{inventarioId}</div>
            </div>

            <div style={{ height: 14 }} />

            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>
                  <FiCamera size={18} style={{ marginRight: 8 }} />
                  Leitura por câmera
                </div>
                <div style={styles.sectionHint}>
                  {loadingCamera
                    ? "Iniciando câmera..."
                    : cameraReady
                      ? "Scanner ativo"
                      : "Câmera desligada"}
                </div>
              </div>

              <div style={styles.helpBox}>
                Aponte a câmera para o código de barras. Quando o produto for encontrado, a câmera pausa automaticamente.
              </div>

              <div style={styles.cameraWrapper}>
                <div
                  id={scannerContainerId}
                  style={{
                    width: "100%",
                    minHeight: 360,
                    display: cameraReady || loadingCamera ? "block" : "none",
                  }}
                />

                {!cameraReady && !loadingCamera && (
                  <div style={styles.cameraPausedBox}>
                    Câmera desligada
                  </div>
                )}
              </div>

              <div style={styles.bottomActions}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={limparLeitura}
                  disabled={loadingCamera}
                >
                  <FiRefreshCw size={16} style={{ marginRight: 8 }} />
                  Nova leitura
                </button>
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>
                  <FiSearch size={18} style={{ marginRight: 8 }} />
                  Busca manual
                </div>
                <div style={styles.sectionHint}>
                  Use quando a câmera não conseguir ler
                </div>
              </div>

              <div style={styles.fieldWrap}>
                <label style={styles.label}>Código de barras</label>
                <input
                  type="text"
                  value={codigoManual}
                  onChange={(e) => setCodigoManual(e.target.value)}
                  placeholder="Digite ou cole o código"
                  style={styles.input}
                />
              </div>

              <div style={styles.bottomActions}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={buscarCodigoManual}
                >
                  <FiSearch size={16} style={{ marginRight: 8 }} />
                  Buscar código
                </button>
              </div>
            </div>

            <div style={{ height: 14 }} />
            {ultimoItemAdicionado && (
              <>
                <div style={styles.successBox}>
                  Último item adicionado: <strong>{ultimoItemAdicionado.nome}</strong> · Qtd:{" "}
                  <strong>{ultimoItemAdicionado.quantidade}</strong>
                </div>
                <div style={{ height: 14 }} />
              </>
            )}

            <div style={{ height: 14 }} />

            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>
                  Últimos itens adicionados
                </div>
                <div style={styles.sectionHint}>
                  {historicoItens.length} registro(s)
                </div>
              </div>

              {historicoItens.length === 0 ? (
                <div style={styles.emptyBox}>
                  Nenhum item adicionado nesta sessão.
                </div>
              ) : (
                <div style={styles.historyList}>
                  {historicoItens.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        ...styles.historyItem,
                        ...(index === 0 ? styles.historyItemHighlight : {}),
                      }}
                    >
                      <div style={styles.historyTopRow}>
                        <strong style={styles.historyName}>{item.nome}</strong>
                        <span style={styles.historyTime}>{item.dataHora}</span>
                      </div>

                      <div style={styles.historyMeta}>
                        <span>Código: {item.codigo}</span>
                        <span>Qtd: {item.quantidade}</span>
                      </div>

                      {(item.lote || item.validade) && (
                        <div style={styles.historyMeta}>
                          <span>Lote: {item.lote || "-"}</span>
                          <span>Validade: {item.validade || "-"}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>
                  <FiSearch size={18} style={{ marginRight: 8 }} />
                  Produto lido
                </div>
                <div style={styles.sectionHint}>
                  {searchingProduct
                    ? "Buscando produto..."
                    : codigoLido
                      ? `Código: ${codigoLido}`
                      : "Nenhum código lido"}
                </div>
              </div>

              {!produto && (
                <div style={styles.emptyBox}>
                  <strong>Nenhum produto carregado.</strong>
                  <div style={{ marginTop: 6 }}>
                    Toque em <strong>Nova leitura</strong> e aponte a câmera para um código de barras.
                  </div>
                </div>
              )}

              {produto && (
                <>
                  <div style={styles.productCard}>
                    <div style={styles.productName}>{produto.nome}</div>
                    <div style={styles.productMeta}>
                      <span>Código: {produto.cod_barra || "-"}</span>
                      <span>Custo médio: {formatMoney(produto.custo_medio)}</span>
                    </div>
                    <div style={styles.productMeta}>
                      <span>Controla lote: {produto.controla_lote ? "Sim" : "Não"}</span>
                      <span>Controla validade: {produto.controla_validade ? "Sim" : "Não"}</span>
                    </div>
                  </div>

                  <div style={styles.formGrid}>
                    <div style={styles.fieldWrap}>
                      <label style={styles.label}>Quantidade contada *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="Ex: 10"
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.qtyShortcutRow}>
                      <button
                        type="button"
                        style={styles.qtyShortcutButton}
                        onClick={() => somarQuantidade(1)}
                      >
                        +1
                      </button>

                      <button
                        type="button"
                        style={styles.qtyShortcutButton}
                        onClick={() => somarQuantidade(5)}
                      >
                        +5
                      </button>

                      <button
                        type="button"
                        style={styles.qtyShortcutButton}
                        onClick={() => somarQuantidade(10)}
                      >
                        +10
                      </button>

                      <button
                        type="button"
                        style={styles.qtyShortcutButtonLight}
                        onClick={limparQuantidade}
                      >
                        Limpar
                      </button>
                    </div>

                    {produto.controla_lote && (
                      <div style={styles.fieldWrap}>
                        <label style={styles.label}>Lote *</label>
                        <input
                          type="text"
                          value={lote}
                          onChange={(e) => setLote(e.target.value)}
                          placeholder="Informe o lote"
                          style={styles.input}
                        />
                      </div>
                    )}

                    {produto.controla_validade && (
                      <div style={styles.fieldWrap}>
                        <label style={styles.label}>Validade *</label>
                        <input
                          type="date"
                          value={validade}
                          onChange={(e) => setValidade(e.target.value)}
                          style={styles.input}
                        />
                      </div>
                    )}

                    <div style={styles.fieldWrap}>
                      <label style={styles.label}>Observação</label>
                      <textarea
                        rows={3}
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        placeholder="Opcional"
                        style={styles.textarea}
                      />
                    </div>
                  </div>

                  <div style={styles.bottomActions}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={limparLeitura}
                      disabled={savingItem}
                    >
                      Limpar
                    </button>

                    <button
                      type="button"
                      style={styles.primaryButton}
                      onClick={adicionarItem}
                      disabled={savingItem}
                    >
                      <FiCheck size={16} style={{ marginRight: 8 }} />
                      {savingItem ? "Adicionando..." : "Adicionar ao inventário"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 12,
  },
  topBar: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  backButton: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
  },
  container: {
    width: "100%",
    maxWidth: 560,
    margin: "0 auto",
  },
  heroCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
  },
  subtitle: {
    margin: "8px 0 0 0",
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.45,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  },
  sectionHint: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 600,
  },
  helpBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.5,
  },
  inventoryBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 14,
    fontWeight: 700,
  },
  linkButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
  cameraPausedBox: {
    minHeight: 280,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: 600,
    background: "#0f172a",
  },
  scanFrame: {
    position: "absolute",
    top: "36%",
    left: "6%",
    width: "88%",
    height: "16%",
    border: "3px solid #22c55e",
    borderRadius: 10,
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.25)",
    pointerEvents: "none",
  },
  cameraWrapper: {
    position: "relative",
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    background: "#000",
    minHeight: 360,
  },
  video: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
    minHeight: 420,
  },
  productCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 8,
  },
  productMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 13,
    color: "#475569",
    marginBottom: 6,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    height: 46,
    borderRadius: 10,
    border: "1px solid #dbe2ea",
    padding: "0 12px",
    boxSizing: "border-box",
    width: "100%",
    fontSize: 16,
    outline: "none",
    background: "#fff",
  },
  textarea: {
    minHeight: 96,
    borderRadius: 10,
    border: "1px solid #dbe2ea",
    padding: "10px 12px",
    resize: "vertical",
    boxSizing: "border-box",
    width: "100%",
    fontSize: 15,
    outline: "none",
    background: "#fff",
  },
  emptyBox: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    padding: 18,
    textAlign: "center",
    color: "#475569",
    fontSize: 14,
  },
  bottomActions: {
    marginTop: 18,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  primaryButton: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 15,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 15,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  successBox: {
    background: "#ecfdf5",
    border: "1px solid #86efac",
    color: "#166534",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 1.4,
  },

  qtyShortcutRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    marginTop: 8,
  },

  qtyShortcutButton: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 10,
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  qtyShortcutButtonLight: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#334155",
    borderRadius: 10,
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  historyItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
  },

  historyItemHighlight: {
    border: "1px solid #93c5fd",
    background: "#eff6ff",
  },

  historyTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },

  historyName: {
    fontSize: 14,
    color: "#0f172a",
  },

  historyTime: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 600,
  },

  historyMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 12,
    color: "#475569",
  },

};