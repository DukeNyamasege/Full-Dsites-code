import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bot, Upload, GripVertical, Trash2, ArrowRight, AlertCircle, FileCode, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface UploadedBot {
  id: string;
  name: string;
  file: File;
  isValid: boolean;
  error?: string;
}

interface SortableBotItemProps {
  bot: UploadedBot;
  index: number;
  onRemove: (id: string) => void;
}

const SortableBotItem = ({ bot, index, onRemove }: SortableBotItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-xl border ${
        bot.isValid 
          ? 'bg-panel-bg border-white/10' 
          : 'bg-red-500/10 border-red-500/30'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>
      
      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
        <span className="text-sm font-bold text-purple-400">{index + 1}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{bot.name}</span>
        </div>
        {!bot.isValid && bot.error && (
          <p className="text-xs text-red-400 mt-1">{bot.error}</p>
        )}
      </div>

      {bot.isValid ? (
        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      )}
      
      <button
        onClick={() => onRemove(bot.id)}
        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4 text-red-400" />
      </button>
    </div>
  );
};

const SetupBots = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [bots, setBots] = useState<UploadedBot[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [domainName, setDomainName] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const siteIdParam = searchParams.get('siteId');
    const domainParam = searchParams.get('domain');
    
    if (!siteIdParam) {
      toast.error('Missing site information');
      navigate('/domains');
      return;
    }
    
    setSiteId(siteIdParam);
    setDomainName(domainParam);
  }, [searchParams, navigate]);

  const validateXML = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/xml');
          
          const parseError = doc.querySelector('parsererror');
          if (parseError) {
            resolve({ isValid: false, error: 'Invalid XML structure' });
            return;
          }
          
          resolve({ isValid: true });
        } catch {
          resolve({ isValid: false, error: 'Failed to parse XML file' });
        }
      };
      reader.onerror = () => resolve({ isValid: false, error: 'Failed to read file' });
      reader.readAsText(file);
    });
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newBots: UploadedBot[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.xml')) {
        newBots.push({
          id: crypto.randomUUID(),
          name: file.name,
          file,
          isValid: false,
          error: 'File must be an XML file',
        });
        continue;
      }

      const validation = await validateXML(file);
      newBots.push({
        id: crypto.randomUUID(),
        name: file.name,
        file,
        isValid: validation.isValid,
        error: validation.error,
      });
    }

    setBots((prev) => [...prev, ...newBots]);
    setIsUploading(false);
    event.target.value = '';
  }, []);

  const handleRemove = useCallback((id: string) => {
    setBots((prev) => prev.filter((bot) => bot.id !== id));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBots((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const validBots = bots.filter((bot) => bot.isValid);

  const handleContinue = () => {
    if (validBots.length === 0) {
      toast.error('Please upload at least one valid XML bot');
      return;
    }

    // Store bots in sessionStorage for the summary page
    sessionStorage.setItem('pendingBots', JSON.stringify(bots.map((b, i) => ({
      id: b.id,
      name: b.name,
      order: i,
      isValid: b.isValid,
    }))));

    // Store actual files for upload
    const filesMap: { [key: string]: File } = {};
    bots.forEach((b) => {
      filesMap[b.id] = b.file;
    });
    // We'll need to re-upload from input, so store file data as base64
    Promise.all(bots.map(async (b) => {
      const reader = new FileReader();
      return new Promise<{ id: string; data: string }>((resolve) => {
        reader.onload = () => resolve({ id: b.id, data: reader.result as string });
        reader.readAsDataURL(b.file);
      });
    })).then((fileData) => {
      sessionStorage.setItem('pendingBotFiles', JSON.stringify(fileData));
      navigate(`/setup/summary?siteId=${siteId}&domain=${encodeURIComponent(domainName || '')}`);
    });
  };

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-medium text-foreground">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">App ID</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-green-500" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-medium text-foreground">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Token</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-primary" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-foreground">3</div>
            <span className="text-sm text-foreground hidden sm:inline">XML Bots</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-muted-foreground">4</div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Review</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-purple flex items-center justify-center glow-purple mx-auto mb-4">
            <Bot className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Upload Your XML Bots</h1>
          {domainName && (
            <p className="text-primary font-medium mb-2">{domainName}</p>
          )}
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload your XML trading bot files and arrange them in your preferred order. Drag to reorder.
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-6">
          <label className="block">
            <div className="rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors p-8 cursor-pointer bg-panel-bg/50">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="text-foreground font-medium mb-1">
                  {isUploading ? 'Processing...' : 'Click to upload XML files'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or drag and drop your XML bot files here
                </p>
              </div>
            </div>
            <input
              type="file"
              accept=".xml"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Bots List */}
        {bots.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">
                Uploaded Bots ({validBots.length} valid of {bots.length})
              </h3>
              <p className="text-xs text-muted-foreground">Drag to reorder</p>
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={bots} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {bots.map((bot, index) => (
                    <SortableBotItem
                      key={bot.id}
                      bot={bot}
                      index={index}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        <Button 
          onClick={handleContinue}
          disabled={validBots.length === 0 || isUploading}
          className="w-full btn-primary h-12 text-base"
        >
          Continue to Review
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SetupBots;
