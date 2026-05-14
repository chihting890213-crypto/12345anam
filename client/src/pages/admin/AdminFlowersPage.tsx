import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type FlowerForm = {
  folderId?: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  category: "holiday" | "other";
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
};

const emptyFlower: FlowerForm = {
  name: "",
  description: "",
  price: "",
  unit: "束",
  category: "other",
  isCustom: false,
  isActive: true,
  sortOrder: 0,
};

export default function AdminFlowersPage() {
  const utils = trpc.useUtils();
  const { data: folders = [] } = trpc.folders.list.useQuery();
  const { data: flowers = [] } = trpc.flowers.list.useQuery();

  // State for navigation
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [showFlowerForm, setShowFlowerForm] = useState(false);
  const [editFlowerId, setEditFlowerId] = useState<number | null>(null);
  const [flowerForm, setFlowerForm] = useState<FlowerForm>(emptyFlower);

  // State for folder management
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editFolderId, setEditFolderId] = useState<number | null>(null);
  const [folderName, setFolderName] = useState("");

  // Mutations
  const createFlower = trpc.flowers.create.useMutation({
    onSuccess: () => {
      toast.success("花卉已新增");
      utils.flowers.list.invalidate();
      setShowFlowerForm(false);
      setFlowerForm(emptyFlower);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateFlower = trpc.flowers.update.useMutation({
    onSuccess: () => {
      toast.success("已更新");
      utils.flowers.list.invalidate();
      setEditFlowerId(null);
      setFlowerForm(emptyFlower);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteFlower = trpc.flowers.delete.useMutation({
    onSuccess: () => {
      toast.success("已刪除");
      utils.flowers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const createFolder = trpc.folders.create.useMutation({
    onSuccess: () => {
      toast.success("資料夾已建立");
      utils.folders.list.invalidate();
      setFolderName("");
      setShowFolderForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateFolder = trpc.folders.update.useMutation({
    onSuccess: () => {
      toast.success("已更新");
      utils.folders.list.invalidate();
      setEditFolderId(null);
      setFolderName("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteFolder = trpc.folders.delete.useMutation({
    onSuccess: () => {
      toast.success("已刪除");
      utils.folders.list.invalidate();
      if (selectedFolderId === editFolderId) setSelectedFolderId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const categoryLabel = (c: string) => (c === "holiday" ? "節慶花卉配送" : "其他");

  // Get flowers for selected folder
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);
  const flowersInFolder = selectedFolderId
    ? flowers.filter((f) => f.folderId === selectedFolderId)
    : [];

  const handleCreateFlower = () => {
    if (!selectedFolderId) {
      toast.error("請先選擇分類");
      return;
    }
    if (!flowerForm.name.trim()) {
      toast.error("請填寫花卉名稱");
      return;
    }
    if (!flowerForm.price) {
      toast.error("請填寫價格");
      return;
    }
    createFlower.mutate({
      ...flowerForm,
      folderId: selectedFolderId,
      price: parseFloat(flowerForm.price),
    } as any);
  };

  const handleUpdateFlower = () => {
    if (!editFlowerId) return;
    if (!flowerForm.name.trim()) {
      toast.error("請填寫花卉名稱");
      return;
    }
    updateFlower.mutate({
      id: editFlowerId,
      ...flowerForm,
      price: parseFloat(flowerForm.price),
    } as any);
  };

  const handleCreateFolder = () => {
    if (!folderName.trim()) {
      toast.error("請填寫資料夾名稱");
      return;
    }
    createFolder.mutate({ name: folderName });
  };

  const handleUpdateFolder = () => {
    if (!editFolderId) return;
    if (!folderName.trim()) {
      toast.error("請填寫資料夾名稱");
      return;
    }
    updateFolder.mutate({ id: editFolderId, name: folderName });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="memphis-title text-3xl text-black">花卉管理</h1>
        <p className="text-black font-bold mt-1">先選擇分類，再管理該分類下的花卉款式</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ─── Left: Categories (Folders) ─── */}
        <div className="lg:col-span-1">
          <div className="memphis-card p-5 bg-[#FFF0A0]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-lg uppercase tracking-wide">分類</h2>
              <button
                onClick={() => {
                  setShowFolderForm(!showFolderForm);
                  setEditFolderId(null);
                  setFolderName("");
                }}
                className="memphis-btn px-3 py-1.5 bg-[#FF7B6B] text-white font-black text-xs uppercase rounded-lg"
              >
                {showFolderForm ? "✕" : "＋"}
              </button>
            </div>

            {/* Folder form */}
            {showFolderForm && (
              <div className="mb-4 p-3 bg-white border-[2px] border-black rounded-lg space-y-2">
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="分類名稱"
                  className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={
                      editFolderId ? handleUpdateFolder : handleCreateFolder
                    }
                    disabled={
                      createFolder.isPending || updateFolder.isPending
                    }
                    className="flex-1 px-3 py-2 bg-[#FF7B6B] text-white font-black text-xs uppercase rounded-lg disabled:opacity-60"
                  >
                    {editFolderId ? "更新" : "新增"}
                  </button>
                  <button
                    onClick={() => {
                      setShowFolderForm(false);
                      setEditFolderId(null);
                      setFolderName("");
                    }}
                    className="flex-1 px-3 py-2 bg-white border-[2px] border-black font-black text-xs uppercase rounded-lg"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* Folders list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {folders.length === 0 ? (
                <div className="text-center py-6 text-gray-500 font-bold">
                  尚無分類
                </div>
              ) : (
                folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`p-3 border-[2px] border-black rounded-lg cursor-pointer transition-all ${
                      selectedFolderId === folder.id
                        ? "bg-[#FF7B6B] text-white"
                        : "bg-white text-black hover:bg-gray-50"
                    }`}
                  >
                    <div
                      onClick={() => setSelectedFolderId(folder.id)}
                      className="flex-1"
                    >
                      <div className="font-black text-sm">{folder.name}</div>
                      <div className="text-xs font-bold opacity-70">
                        {flowers.filter((f) => f.folderId === folder.id)
                          .length}{" "}
                        件
                      </div>
                    </div>
                    {selectedFolderId === folder.id && (
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => {
                            setEditFolderId(folder.id);
                            setFolderName(folder.name);
                            setShowFolderForm(true);
                          }}
                          className="flex-1 px-2 py-1 bg-white text-black border-[1px] border-white font-bold text-xs rounded"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "確定刪除此分類？該分類下的花卉將被保留。"
                              )
                            ) {
                              deleteFolder.mutate({ id: folder.id });
                            }
                          }}
                          className="flex-1 px-2 py-1 bg-white text-black border-[1px] border-white font-bold text-xs rounded"
                        >
                          刪除
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ─── Right: Flowers in selected category ─── */}
        <div className="lg:col-span-3">
          {!selectedFolderId ? (
            <div className="memphis-card p-8 bg-[#FFD6C0] text-center">
              <div className="text-5xl mb-4">👈</div>
              <p className="font-black text-lg text-black">
                請先選擇左側分類
              </p>
              <p className="text-sm font-bold text-black/60 mt-2">
                選擇後即可新增或編輯該分類下的花卉
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="memphis-title text-2xl text-black">
                    {selectedFolder?.name}
                  </h2>
                  <p className="text-sm font-bold text-black/60">
                    共 {flowersInFolder.length} 件花卉
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowFlowerForm(!showFlowerForm);
                    setFlowerForm(emptyFlower);
                    setEditFlowerId(null);
                  }}
                  className="memphis-btn px-5 py-2.5 bg-[#FF7B6B] text-white font-black uppercase tracking-wide rounded-lg"
                >
                  {showFlowerForm ? "✕ 取消" : "＋ 新增花卉"}
                </button>
              </div>

              {/* Flower form */}
              {showFlowerForm && (
                <div className="memphis-card p-6 bg-[#FFF0A0]">
                  <h3 className="font-black text-lg mb-4 uppercase">
                    {editFlowerId ? "編輯花卉" : "新增花卉"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase mb-1">
                        花卉名稱
                      </label>
                      <input
                        type="text"
                        value={flowerForm.name}
                        onChange={(e) =>
                          setFlowerForm((f) => ({
                            ...f,
                            name: e.target.value,
                          }))
                        }
                        placeholder="例：紅玫瑰"
                        className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase mb-1">
                        描述
                      </label>
                      <textarea
                        value={flowerForm.description}
                        onChange={(e) =>
                          setFlowerForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        placeholder="花卉描述"
                        rows={3}
                        className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">
                          價格
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={flowerForm.price}
                          onChange={(e) =>
                            setFlowerForm((f) => ({
                              ...f,
                              price: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">
                          單位
                        </label>
                        <input
                          type="text"
                          value={flowerForm.unit}
                          onChange={(e) =>
                            setFlowerForm((f) => ({
                              ...f,
                              unit: e.target.value,
                            }))
                          }
                          placeholder="束"
                          className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">
                          類別
                        </label>
                        <select
                          value={flowerForm.category}
                          onChange={(e) =>
                            setFlowerForm((f) => ({
                              ...f,
                              category: e.target.value as any,
                            }))
                          }
                          className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                        >
                          <option value="holiday">節慶花卉配送</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">
                          排序
                        </label>
                        <input
                          type="number"
                          value={flowerForm.sortOrder}
                          onChange={(e) =>
                            setFlowerForm((f) => ({
                              ...f,
                              sortOrder: Number(e.target.value),
                            }))
                          }
                          className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={flowerForm.isCustom}
                          onChange={(e) =>
                            setFlowerForm((f) => ({
                              ...f,
                              isCustom: e.target.checked,
                            }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="font-bold text-sm">
                          自訂花卉（客戶可自填價格）
                        </span>
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={
                          editFlowerId
                            ? handleUpdateFlower
                            : handleCreateFlower
                        }
                        disabled={
                          createFlower.isPending || updateFlower.isPending
                        }
                        className="flex-1 py-3 bg-[#FF7B6B] text-white font-black uppercase rounded-lg disabled:opacity-60"
                      >
                        {editFlowerId ? "更新花卉" : "新增花卉"}
                      </button>
                      <button
                        onClick={() => {
                          setShowFlowerForm(false);
                          setFlowerForm(emptyFlower);
                          setEditFlowerId(null);
                        }}
                        className="flex-1 py-3 bg-white border-[2px] border-black font-black uppercase rounded-lg"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Flowers list */}
              {flowersInFolder.length === 0 ? (
                <div className="memphis-card p-8 text-center">
                  <p className="font-bold text-gray-500">
                    此分類尚無花卉，點擊上方「新增花卉」開始新增
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flowersInFolder.map((flower) => (
                    <div
                      key={flower.id}
                      className="memphis-card p-4 bg-white border-[2px] border-black"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-black text-lg">{flower.name}</h3>
                          <p className="text-xs font-bold text-gray-500">
                            {categoryLabel(flower.category)}
                          </p>
                        </div>
                        {flower.isCustom && (
                          <span className="bg-[#FFB899] border-[2px] border-black px-2 py-1 font-black text-xs rounded">
                            自訂
                          </span>
                        )}
                      </div>

                      {flower.description && (
                        <p className="text-sm font-bold text-black/70 mb-2">
                          {flower.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-black text-lg text-[#FF7B6B]">
                          ${flower.price ?? 0}
                        </span>
                        <span className="font-bold text-sm text-black/60">
                          / {flower.unit}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditFlowerId(flower.id);
                            setFlowerForm({
                              name: flower.name,
                              description: flower.description || "",
                              price: (flower.price ?? 0).toString(),
                              unit: flower.unit,
                              category: flower.category as any,
                              isCustom: flower.isCustom,
                              isActive: flower.isActive,
                              sortOrder: flower.sortOrder,
                              folderId: flower.folderId ?? undefined,
                            });
                            setShowFlowerForm(true);
                          }}
                          className="flex-1 px-3 py-2 bg-[#B8F0D8] border-[2px] border-black font-black text-xs uppercase rounded-lg"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("確定刪除此花卉？")) {
                              deleteFlower.mutate({ id: flower.id });
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-[#FF7B6B] text-white border-[2px] border-black font-black text-xs uppercase rounded-lg"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
