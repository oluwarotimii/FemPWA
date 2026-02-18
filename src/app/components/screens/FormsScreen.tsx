import { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Receipt,
  Laptop,
  ClipboardCheck,
  Plane,
  Key,
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { formsApi } from '@/app/services/api';

const iconMap: Record<string, any> = {
  book: FileText,
  receipt: Receipt,
  laptop: Laptop,
  clipboard: ClipboardCheck,
  plane: Plane,
  key: Key,
};

export function FormsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await formsApi.getForms();
        setForms(response.data.forms);
      } catch (error) {
        console.error('Failed to fetch forms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'HR Policies', 'Expense Claims', 'IT Support'];

  if (loading) {
    return (
      <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12 text-gray-500">Loading forms...</div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Forms & Resources</h1>
        <p className="text-gray-500 text-sm">Access company documents and forms</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="search"
          placeholder="Search forms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          <TabsTrigger value="HR Policies" className="text-xs">
            HR
          </TabsTrigger>
          <TabsTrigger value="Expense Claims" className="text-xs">
            Expense
          </TabsTrigger>
          <TabsTrigger value="IT Support" className="text-xs">
            IT
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {filteredForms.length === 0 ? (
            <Card className="shadow-md">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No forms found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try a different search term
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredForms.map((form) => {
                // Map category to an icon
                let icon = 'book'; // default
                if (form.category.includes('Expense')) icon = 'receipt';
                if (form.category.includes('IT')) icon = 'laptop';
                if (form.category.includes('HR')) icon = 'clipboard';

                const IconComponent = iconMap[icon] || FileText;
                return (
                  <Card
                    key={form.id}
                    className="shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-[#1A2B3C]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <IconComponent className="w-6 h-6 text-[#1A2B3C]" />
                      </div>
                      <h3 className="font-medium text-sm text-gray-900 mb-2">
                        {form.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs bg-gray-50 text-gray-600"
                      >
                        {form.category}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Documents */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recently Accessed
        </h2>
        <div className="space-y-2">
          {forms.slice(0, 3).map((form) => {
            // Map category to an icon
            let icon = 'book'; // default
            if (form.category.includes('Expense')) icon = 'receipt';
            if (form.category.includes('IT')) icon = 'laptop';
            if (form.category.includes('HR')) icon = 'clipboard';

            const IconComponent = iconMap[icon] || FileText;
            return (
              <Card
                key={form.id}
                className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {form.name}
                    </h3>
                    <p className="text-xs text-gray-500">{form.category}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    PDF
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
