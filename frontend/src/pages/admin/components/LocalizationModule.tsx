import { useState, useEffect } from "react";
import { Globe, Save, Loader2, Search } from "lucide-react";
import { apiClient } from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";

export function LocalizationModule() {
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const languages = [
    { code: "en", name: "English" },
    { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
    { code: "hi", name: "Hindi (हिंदी)" }
  ];

  useEffect(() => {
    fetchTranslations();
  }, []);

  const fetchTranslations = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<any>('/admin/translations');
      setTranslations(data || {});
    } catch (err: any) {
      toast.error(err.message || "Failed to load translations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await apiClient.post('/admin/translations', {
        lang: selectedLang,
        key,
        value
      });
      // Optimistically update local state
      const newTranslations = { ...translations };
      
      // Helper to set nested key
      const keys = key.split('.');
      let current = newTranslations[selectedLang];
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      setTranslations(newTranslations);
      toast.success("Translation updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save translation");
    } finally {
      setSavingKey(null);
    }
  };

  // Helper to flatten nested JSON object for easy rendering
  const flattenObject = (obj: any, prefix = ''): { key: string, value: string }[] => {
    if (!obj) return [];
    return Object.keys(obj).reduce((acc: any[], k: string) => {
      const pre = prefix.length ? prefix + '.' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else {
        acc.push({ key: pre + k, value: obj[k] });
      }
      return acc;
    }, []);
  };

  const flatTranslations = flattenObject(translations[selectedLang] || {});
  const filteredTranslations = flatTranslations.filter(t => 
    t.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(t.value).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-3">
            <Globe className="w-6 h-6 text-gold-500" /> Dynamic Localization Manager
          </h2>
          <p className="text-sm text-navy-950/60 mt-1">Update platform text and languages in real-time without redeploying code.</p>
        </div>

        <div className="flex bg-sand-100 p-1 rounded-2xl">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setSelectedLang(l.code)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedLang === l.code ? "bg-white shadow-sm text-navy-950" : "text-navy-950/60 hover:text-navy-950"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-sand-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-sand-100 bg-sand-50/50 flex items-center gap-3">
          <Search className="w-5 h-5 text-navy-950/40" />
          <input 
            type="text"
            placeholder="Search keys or text..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-navy-950"
          />
        </div>
        
        <div className="max-h-[600px] overflow-y-auto p-2">
          {filteredTranslations.length === 0 ? (
            <div className="p-8 text-center text-navy-950/40">No translations found for "{searchQuery}"</div>
          ) : (
            <div className="space-y-2">
              {filteredTranslations.map(({ key, value }) => (
                <TranslationRow 
                  key={key} 
                  translationKey={key} 
                  initialValue={value} 
                  isSaving={savingKey === key}
                  onSave={(val) => handleUpdate(key, val)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TranslationRow({ translationKey, initialValue, isSaving, onSave }: { translationKey: string, initialValue: string, isSaving: boolean, onSave: (val: string) => void }) {
  const [value, setValue] = useState(initialValue);
  const isChanged = value !== initialValue;

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 hover:bg-sand-50 rounded-2xl transition-colors items-start md:items-center">
      <div className="w-full md:w-1/3">
        <p className="text-xs font-mono font-bold text-navy-950/60 break-all">{translationKey}</p>
      </div>
      <div className="flex-1 flex gap-2 w-full">
        <input 
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-4 py-2 bg-white border border-sand-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
        />
        {isChanged && (
          <Button 
            onClick={() => onSave(value)}
            disabled={isSaving}
            className="h-[38px] px-4 rounded-xl text-xs gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        )}
      </div>
    </div>
  );
}
