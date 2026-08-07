import { useState } from 'react';
import { Plus, CheckCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  title: string;
  category: 'work' | 'personal' | 'shopping';
  completed: boolean;
  createdAt: Date;
}

const categoryColors = {
  work: 'bg-primary/10 text-primary border-primary/20',
  personal: 'bg-secondary/10 text-secondary border-secondary/20', 
  shopping: 'bg-accent/10 text-accent border-accent/20'
};

export default function MainApp() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Review project proposal', category: 'work', completed: false, createdAt: new Date() },
    { id: '2', title: 'Buy groceries', category: 'shopping', completed: false, createdAt: new Date() },
    { id: '3', title: 'Call mom', category: 'personal', completed: true, createdAt: new Date() },
  ]);
  
  const [newTask, setNewTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'work' | 'personal' | 'shopping'>('work');

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now().toString(),
        title: newTask.trim(),
        category: selectedCategory,
        completed: false,
        createdAt: new Date()
      }]);
      setNewTask('');
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Task Manager
          </h1>
          <p className="text-muted-foreground">Stay organized and productive</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-foreground">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6 text-center">
              <User className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Task Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="What needs to be done?"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                className="text-lg"
              />
              
              <div className="flex flex-wrap gap-2">
                {(['work', 'personal', 'shopping'] as const).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
              
              <Button onClick={addTask} className="w-full lg:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-muted-foreground">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No tasks yet!</p>
                  <p className="text-sm">Add your first task above to get started.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card 
                key={task.id} 
                className={`transition-all duration-300 hover:shadow-md ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTask(task.id)}
                        className={`p-1 h-8 w-8 rounded-full ${
                          task.completed 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'border-2 border-muted-foreground hover:border-primary'
                        }`}
                      >
                        {task.completed && <CheckCircle className="w-4 h-4" />}
                      </Button>
                      
                      <div className="flex-1">
                        <p className={`font-medium ${
                          task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}>
                          {task.title}
                        </p>
                      </div>
                      
                      <Badge className={categoryColors[task.category]}>
                        {task.category}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      ×
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}